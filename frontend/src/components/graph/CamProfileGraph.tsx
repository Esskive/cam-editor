import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ReferenceLine,
} from 'recharts';
import { Box, Paper, Typography, FormGroup, FormControlLabel, Switch } from '@mui/material';
import { CamValuePoint, CamProfile } from '../../types';
import { calculationAPI } from '../../services/api';

interface CamProfileGraphProps {
  camProfile: CamProfile | null;
  showPosition: boolean;
  showVelocity: boolean;
  showAcceleration: boolean;
  onCursorPositionChange: (position: CamValuePoint | null) => void;
  onTogglePosition?: () => void;
  onToggleVelocity?: () => void;
  onToggleAcceleration?: () => void;
}

const CamProfileGraph: React.FC<CamProfileGraphProps> = ({
  camProfile,
  showPosition,
  showVelocity,
  showAcceleration,
  onCursorPositionChange,
  onTogglePosition,
  onToggleVelocity,
  onToggleAcceleration,
}) => {
  const [graphData, setGraphData] = useState<CamValuePoint[]>([]);
  const [transitionPoints, setTransitionPoints] = useState<{
    position: CamValuePoint[];
    velocity: CamValuePoint[];
    acceleration: CamValuePoint[];
  }>({
    position: [],
    velocity: [],
    acceleration: [],
  });

  // Calculate min and max values for the profile
  const minX = camProfile?.segments[0]?.x1 || 0;
  const maxX = camProfile?.segments[camProfile.segments.length - 1]?.x2 || 360;
  
  // Ajouter une marge au domaine X pour s'assurer que tous les points sont visibles
  const xDomainMin = minX;
  const xDomainMax = maxX + (maxX - minX) * 0.05; // Ajouter 5% de marge à droite

  // Calculer les domaines pour chaque axe Y
  const calculateDomains = () => {
    // Fonction utilitaire pour calculer le domaine d'une courbe
    const getDomainForCurve = (data: CamValuePoint[], key: 'position' | 'velocity' | 'acceleration', isVisible: boolean) => {
      if (!data || data.length === 0 || !isVisible) return { min: 0, max: 1, hasNegative: false };
      const values = data.map(point => point[key]).filter(val => val !== undefined && !isNaN(val));
      if (values.length === 0) return { min: 0, max: 1, hasNegative: false };
      
      const min = Math.min(...values);
      const max = Math.max(...values);
      return { min, max, hasNegative: min < 0 };
    };

    // Calculer les domaines bruts pour chaque courbe
    const positionRange = getDomainForCurve(graphData, 'position', showPosition);
    const velocityRange = getDomainForCurve(graphData, 'velocity', showVelocity);
    const accelerationRange = getDomainForCurve(graphData, 'acceleration', showAcceleration);

    // Vérifier si au moins une courbe a des valeurs négatives
    const hasNegativeValues = positionRange.hasNegative || velocityRange.hasNegative || accelerationRange.hasNegative;

    // Calculer le facteur d'échelle en fonction du nombre de courbes visibles
    const visibleCount = [showPosition, showVelocity, showAcceleration].filter(Boolean).length;
    const baseScaleFactor = visibleCount === 1 ? 1.2 : (visibleCount === 2 ? 1.1 : 1);

    // Fonction pour calculer le domaine final d'une courbe
    const calculateFinalDomain = (range: { min: number, max: number }, isVisible: boolean) => {
      if (!isVisible) return [0, 1];

      const margin = Math.max(Math.abs(range.max), Math.abs(range.min)) * 0.05;
      const totalRange = Math.abs(range.max - range.min);

      if (hasNegativeValues) {
        // Si des valeurs négatives existent, centrer autour de zéro
        const maxAbsValue = Math.max(Math.abs(range.min), Math.abs(range.max));
        const finalRange = (maxAbsValue + margin) * baseScaleFactor;
        return [-finalRange, finalRange];
      } else {
        // Pour les valeurs uniquement positives ou négatives
        if (range.min >= 0) {
          // Valeurs positives
          const adjustedMax = range.max + margin;
          const adjustedMin = Math.max(0, range.min - margin);
          return [adjustedMin, adjustedMax * baseScaleFactor];
        } else {
          // Valeurs négatives
          const adjustedMin = range.min - margin;
          const adjustedMax = Math.min(0, range.max + margin);
          return [adjustedMin * baseScaleFactor, adjustedMax];
        }
      }
    };

    return {
      positionDomain: calculateFinalDomain(positionRange, showPosition),
      velocityDomain: calculateFinalDomain(velocityRange, showVelocity),
      accelerationDomain: calculateFinalDomain(accelerationRange, showAcceleration)
    };
  };

  // Calculer les domaines en fonction des courbes visibles
  const { positionDomain, velocityDomain, accelerationDomain } = calculateDomains();

  // Extraire les points de transition uniques pour X et Y
  const transitionXValues = camProfile?.segments
    .flatMap(segment => [segment.x1, segment.x2])
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort((a, b) => a - b) || [];

  // Extraire toutes les valeurs Y importantes (Y1, Y2) pour les graduations de l'axe Y
  const transitionYValues = showPosition ? (camProfile?.segments
    .flatMap(segment => [segment.y1, segment.y2])
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort((a, b) => a - b) || []) : [];

  // Ajouter des valeurs intermédiaires pour l'axe Y si nécessaire
  const enhancedYValues = [...transitionYValues];
  if (transitionYValues.length > 0) {
    const minY = Math.min(...transitionYValues);
    const maxY = Math.max(...transitionYValues);
    
    // Ajouter des valeurs intermédiaires si l'écart est grand
    if (maxY - minY > 50) {
      const step = Math.round((maxY - minY) / 5); // Diviser l'intervalle en 5 parties
      for (let i = 1; i < 5; i++) {
        const intermediateValue = minY + step * i;
        if (!enhancedYValues.includes(intermediateValue)) {
          enhancedYValues.push(intermediateValue);
        }
      }
      // Trier les valeurs
      enhancedYValues.sort((a, b) => a - b);
    }
  }

  useEffect(() => {
    const fetchGraphData = async () => {
      if (!camProfile || camProfile.segments.length === 0) {
        console.log('No profile or segments available');
        setGraphData([]);
        return;
      }

      try {
        console.log('Current profile:', camProfile);
        console.log('Current segments:', camProfile.segments);

        // S'assurer que tous les segments ont les propriétés requises
        const formattedSegments = camProfile.segments.map(segment => {
          const formatted = {
            ...segment,
            curveType: segment.curveType || 'Linear',
            x1: Number(segment.x1),
            y1: Number(segment.y1),
            v1: Number(segment.v1),
            a1: Number(segment.a1),
            x2: Number(segment.x2),
            y2: Number(segment.y2),
            v2: Number(segment.v2),
            a2: Number(segment.a2)
          };

          // Calculer automatiquement V2 pour les segments de type Linear
          if (formatted.curveType === 'Linear') {
            const deltaX = formatted.x2 - formatted.x1;
            if (deltaX !== 0) {
              formatted.v2 = (formatted.y2 - formatted.y1) / deltaX;
            }
          }

          // Vérifier que toutes les valeurs sont des nombres valides
          if (isNaN(formatted.x1) || isNaN(formatted.y1) || isNaN(formatted.v1) || 
              isNaN(formatted.a1) || isNaN(formatted.x2) || isNaN(formatted.y2) || 
              isNaN(formatted.v2) || isNaN(formatted.a2)) {
            console.error('Invalid segment values:', segment);
            return null;
          }

          return formatted;
        }).filter(Boolean); // Supprimer les segments invalides

        console.log('Formatted segments:', formattedSegments);

        if (formattedSegments.length === 0) {
          console.error('No valid segments after formatting');
          setGraphData([]);
          return;
        }

        const data = await calculationAPI.calculateCurves(
          formattedSegments,
          500 // Revenir à 500 points
        );

        console.log('Received data from API:', data);

        if (!data || data.length === 0) {
          console.error('No data received from API');
          setGraphData([]);
          return;
        }

        // Utiliser directement les données de l'API
        const formattedData = data.map((point: CamValuePoint) => ({
          ...point,
          x: Number(point.x)
        }));

        // S'assurer que le dernier point est inclus et exactement à X2
        if (formattedSegments.length > 0) {
          const lastSegment = formattedSegments[formattedSegments.length - 1];
          if (lastSegment) {
            const lastX = Number(lastSegment.x2);
            
            // Supprimer tout point qui serait très proche du dernier point
            const filteredData = formattedData.filter((p: CamValuePoint) => Math.abs(p.x - lastX) > 0.1);
            
            // Ajouter le point exact à la fin
            filteredData.push({
              x: lastX,
              position: Number(lastSegment.y2),
              velocity: Number(lastSegment.v2),
              acceleration: Number(lastSegment.a2)
            });
            
            // Remplacer les données formatées
            formattedData.length = 0;
            formattedData.push(...filteredData);
          }
        }

        console.log('Formatted data first point:', formattedData[0]);
        console.log('Formatted data last point:', formattedData[formattedData.length - 1]);
        console.log('Data range:', {
          minX: Math.min(...formattedData.map((p: CamValuePoint) => p.x)),
          maxX: Math.max(...formattedData.map((p: CamValuePoint) => p.x))
        });

        // Créer les points de transition pour chaque segment
        const transitionPoints = formattedSegments
          .filter((segment): segment is NonNullable<typeof segment> => segment !== null)
          .slice(1) // Ignorer le premier segment car il n'a pas de point de transition
          .map(segment => ({
            x: Number(segment.x1),
            position: Number(segment.y1),
            velocity: Number(segment.v1),
            acceleration: Number(segment.a1),
            isTransitionPoint: true
          }));

        // Ajouter le point final du dernier segment comme point de transition
        if (formattedSegments.length > 0) {
          const lastSegment = formattedSegments[formattedSegments.length - 1];
          if (lastSegment) {
            transitionPoints.push({
              x: Number(lastSegment.x2),
              position: Number(lastSegment.y2),
              velocity: Number(lastSegment.v2),
              acceleration: Number(lastSegment.a2),
              isTransitionPoint: true
            });
          }
        }

        console.log('Transition points:', transitionPoints);

        setTransitionPoints({
          position: transitionPoints,
          velocity: transitionPoints,
          acceleration: transitionPoints
        });

        setGraphData(formattedData);
      } catch (error) {
        console.error('Error fetching graph data:', error);
        setGraphData([]);
      }
    };

    fetchGraphData();
  }, [camProfile?.segments.map(segment => 
    `${segment.x1},${segment.y1},${segment.v1},${segment.a1},${segment.x2},${segment.y2},${segment.v2},${segment.a2},${segment.curveType}`
  ).join('|')]);

  // Fonction utilitaire pour formater les nombres
  const formatNumber = (value: number) => {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  };

  // Custom tooltip to display values at cursor position
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Vérifier si nous sommes sur un point de transition en comparant la valeur X
      const xValue = Number(label);
      
      // Trouver si cette valeur X correspond à un point de transition
      const isTransitionX = transitionXValues.some(x => Math.abs(x - xValue) < 0.001);
      
      if (isTransitionX && camProfile?.segments) {
        // Chercher d'abord si c'est un point de début de segment (X1)
        const startSegmentIndex = camProfile.segments.findIndex(
          segment => Math.abs(Number(segment.x1) - xValue) < 0.001
        );
        
        // Chercher ensuite si c'est un point de fin de segment (X2)
        const endSegmentIndex = camProfile.segments.findIndex(
          segment => Math.abs(Number(segment.x2) - xValue) < 0.001
        );
        
        // Si c'est un point de début de segment
        if (startSegmentIndex > 0) {
          const segment = camProfile.segments[startSegmentIndex];
          
          return (
            <Paper sx={{ p: 1, bgcolor: 'background.paper' }}>
              <Typography variant="body2" sx={{ color: 'text.primary' }}>X: {formatNumber(xValue)}</Typography>
              {showPosition && (
                <Typography variant="body2" sx={{ color: '#FF3D00' }}>
                  Position: {formatNumber(Number(segment.y1))}
                </Typography>
              )}
              {showVelocity && (
                <Typography variant="body2" sx={{ color: '#00FF9D' }}>
                  Velocity: {formatNumber(Number(segment.v1))}
                </Typography>
              )}
              {showAcceleration && (
                <Typography variant="body2" sx={{ color: '#00B8FF' }}>
                  Acceleration: {formatNumber(Number(segment.a1))}
                </Typography>
              )}
            </Paper>
          );
        }
        // Si c'est un point de fin de segment
        else if (endSegmentIndex >= 0) {
          const segment = camProfile.segments[endSegmentIndex];
          
          return (
            <Paper sx={{ p: 1, bgcolor: 'background.paper' }}>
              <Typography variant="body2" sx={{ color: 'text.primary' }}>X: {formatNumber(xValue)}</Typography>
              {showPosition && (
                <Typography variant="body2" sx={{ color: '#FF3D00' }}>
                  Position: {formatNumber(Number(segment.y2))}
                </Typography>
              )}
              {showVelocity && (
                <Typography variant="body2" sx={{ color: '#00FF9D' }}>
                  Velocity: {formatNumber(Number(segment.v2))}
                </Typography>
              )}
              {showAcceleration && (
                <Typography variant="body2" sx={{ color: '#00B8FF' }}>
                  Acceleration: {formatNumber(Number(segment.a2))}
                </Typography>
              )}
            </Paper>
          );
        }
      }

      // Pour les points normaux, utiliser le comportement existant
      // Créer une Map pour stocker les valeurs uniques
      const uniqueValues = new Map();
      
      // Parcourir le payload et ne garder que les valeurs des lignes principales
      payload.forEach((entry: any) => {
        // Ne garder que les entrées des composants Line
        if (entry.name && 
            entry.value !== null && 
            entry.value !== undefined && 
            typeof entry.value === 'number' && 
            !isNaN(entry.value)) {
          // Normaliser le nom (première lettre en majuscule)
          const normalizedName = entry.name.charAt(0).toUpperCase() + entry.name.slice(1).toLowerCase();
          // Utiliser le nom normalisé comme clé pour garantir l'unicité
          uniqueValues.set(normalizedName, {
            value: entry.value,
            color: entry.color
          });
        }
      });

      // Convertir la Map en tableau et trier selon l'ordre souhaité
      const sortedEntries = Array.from(uniqueValues.entries())
        .sort(([nameA], [nameB]) => {
          const order: { [key: string]: number } = { Position: 0, Velocity: 1, Acceleration: 2 };
          return order[nameA] - order[nameB];
        });

      return (
        <Paper sx={{ p: 1, bgcolor: 'background.paper' }}>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>X: {formatNumber(Number(label))}</Typography>
          {sortedEntries.map(([name, data]) => (
            <Typography
              key={name}
              variant="body2"
              sx={{ color: data.color }}
            >
              {name}: {formatNumber(data.value)}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#111C44' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Cam Profile Graph
          </Typography>
          <FormGroup row>
            <FormControlLabel
              control={
                <Switch 
                  checked={showPosition} 
                  onChange={onTogglePosition} 
                  color="primary"
                />
              }
              label="Position"
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={showVelocity} 
                  onChange={onToggleVelocity} 
                  color="primary"
                />
              }
              label="Velocity"
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={showAcceleration} 
                  onChange={onToggleAcceleration} 
                  color="primary"
                />
              }
              label="Acceleration"
            />
          </FormGroup>
        </Box>

        <Box sx={{ flexGrow: 1, minHeight: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={graphData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#4F4E55"
                strokeOpacity={0.3}
                vertical={false}
                horizontal={false}
                strokeWidth={1}
              />
              {/* Lignes de référence verticales aux points de transition */}
              {showPosition && transitionXValues.map((x: number, index: number) => (
                <ReferenceLine
                  key={`vline-${index}`}
                  x={x}
                  yAxisId="position"
                  stroke="#4F4E55"
                  strokeDasharray="3 3"
                  strokeOpacity={0.8}
                  strokeWidth={1}
                />
              ))}
              {/* Lignes de référence horizontales aux points de transition de position */}
              {showPosition && transitionYValues.map((y: number, index: number) => (
                <ReferenceLine
                  key={`hline-position-${index}`}
                  y={y}
                  yAxisId="position"
                  stroke="#4F4E55"
                  strokeDasharray="3 3"
                  strokeOpacity={0.8}
                  strokeWidth={1}
                />
              ))}
              <XAxis
                dataKey="x"
                stroke="#F8F8F8"
                label={{
                  value: `Master (${camProfile?.masterUnit || 'degrees'})`,
                  position: 'insideBottomRight',
                  offset: -5,
                  fill: '#F8F8F8',
                  style: { fontSize: '12px', fontWeight: 500 }
                }}
                tick={{ fill: '#F8F8F8' }}
                tickFormatter={(value) => {
                  // Vérifier si le nombre a des décimales
                  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
                }}
                domain={[xDomainMin, xDomainMax]}
                type="number"
                allowDataOverflow={false}
                ticks={transitionXValues}
              />
              {/* Position Y-Axis (left) */}
              {showPosition && (
                <YAxis
                  yAxisId="position"
                  stroke="#F8F8F8"
                  label={{
                    value: `Position (${camProfile?.slaveUnit || 'mm'})`,
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#F8F8F8',
                    style: { fontSize: '12px', fontWeight: 500 }
                  }}
                  orientation="left"
                  tick={{ fill: '#F8F8F8' }}
                  tickFormatter={(value) => {
                    // Vérifier si le nombre a des décimales
                    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
                  }}
                  domain={positionDomain}
                  hide={!showPosition}
                  ticks={enhancedYValues}
                />
              )}
              {/* Velocity Y-Axis (right) - masqué mais toujours présent pour le graphique */}
              {showVelocity && (
                <YAxis
                  yAxisId="velocity"
                  stroke="#F8F8F8"
                  orientation="right"
                  domain={velocityDomain}
                  hide={true}
                />
              )}
              {/* Acceleration Y-Axis (far right) - masqué mais toujours présent pour le graphique */}
              {showAcceleration && (
                <YAxis
                  yAxisId="acceleration"
                  stroke="#F8F8F8"
                  orientation="right"
                  domain={accelerationDomain}
                  hide={true}
                />
              )}
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ 
                  stroke: '#3F04BF', 
                  strokeWidth: 1, 
                  strokeDasharray: '3 3',
                  strokeOpacity: 0.8
                }}
                filterNull={false}
                isAnimationActive={false}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  color: '#F8F8F8',
                  fontSize: '12px'
                }}
              />
              {/* Courbes dans l'ordre : accélération (arrière), vitesse (milieu), position (avant) */}
              {showAcceleration && (
                <Line
                  yAxisId="acceleration"
                  type="monotone"
                  dataKey="acceleration"
                  stroke="#00B8FF"
                  name="Acceleration"
                  dot={false}
                  strokeWidth={2}
                  activeDot={{ r: 4, fill: '#00B8FF', strokeWidth: 0 }}
                  data={graphData}
                  connectNulls={true}
                  isAnimationActive={false}
                  animationDuration={0}
                  tooltipType="none"
                  strokeOpacity={1}
                />
              )}
              {showVelocity && (
                <Line
                  yAxisId="velocity"
                  type="monotone"
                  dataKey="velocity"
                  stroke="#00FF9D"
                  name="Velocity"
                  dot={false}
                  strokeWidth={2}
                  activeDot={{ r: 4, fill: '#00FF9D', strokeWidth: 0 }}
                  data={graphData}
                  connectNulls={true}
                  isAnimationActive={false}
                  animationDuration={0}
                  tooltipType="none"
                  strokeOpacity={1}
                />
              )}
              {showPosition && (
                <Line
                  yAxisId="position"
                  type="monotone"
                  dataKey="position"
                  stroke="#FF3D00"
                  name="Position"
                  dot={false}
                  strokeWidth={2}
                  activeDot={{ r: 4, fill: '#FF3D00', strokeWidth: 0 }}
                  data={graphData}
                  connectNulls={true}
                  isAnimationActive={false}
                  animationDuration={0}
                  tooltipType="none"
                  strokeOpacity={1}
                />
              )}
              {/* Points de transition dans le même ordre */}
              {showAcceleration && (
                <Scatter
                  yAxisId="acceleration"
                  data={transitionPoints.acceleration}
                  fill="#00B8FF"
                  line={false}
                  shape="circle"
                  dataKey="acceleration"
                  legendType="none"
                  r={6}
                />
              )}
              {showVelocity && (
                <Scatter
                  yAxisId="velocity"
                  data={transitionPoints.velocity}
                  fill="#00FF9D"
                  line={false}
                  shape="circle"
                  dataKey="velocity"
                  legendType="none"
                  r={6}
                />
              )}
              {showPosition && (
                <Scatter
                  yAxisId="position"
                  data={transitionPoints.position}
                  fill="#FF3D00"
                  line={false}
                  shape="circle"
                  dataKey="position"
                  legendType="none"
                  r={6}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
};

export default CamProfileGraph;