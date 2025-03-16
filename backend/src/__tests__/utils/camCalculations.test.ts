import * as camCalculations from '../../utils/camCalculations';

// Ajouter les types pour les résultats des calculs
interface CamProfileResult {
  position: number;
  velocity: number;
  acceleration: number;
}

interface CamProfileRangeResult {
  angle: number;
  radius: number;
}

describe('Cam Calculations Utils', () => {
  describe('calculateLinear', () => {
    it('should calculate linear curve correctly', () => {
      // Arrange
      const x = 5;
      const x1 = 0;
      const y1 = 10;
      const v1 = 0;
      const a1 = 0;
      const x2 = 10;
      const y2 = 20;
      const v2 = 0;
      const a2 = 0;

      // Act
      const result = camCalculations.calculateLinear(
        x, x1, y1, v1, a1, x2, y2, v2, a2
      );

      // Assert
      expect(result.position).toBeCloseTo(15, 5); // Position at midpoint
      expect(result.velocity).toBeCloseTo(1, 5); // Constant velocity
      expect(result.acceleration).toBeCloseTo(0, 5); // Zero acceleration
    });
  });

  describe('calculatePolynomial3', () => {
    it('should calculate polynomial 3 curve correctly', () => {
      // Arrange
      const x = 5;
      const x1 = 0;
      const y1 = 10;
      const v1 = 0;
      const a1 = 0;
      const x2 = 10;
      const y2 = 20;
      const v2 = 0;
      const a2 = 0;

      // Act
      const result = camCalculations.calculatePolynomial3(
        x, x1, y1, v1, a1, x2, y2, v2, a2
      );

      // Assert
      // For a polynomial with zero initial and final velocities,
      // the position at midpoint should be 15
      expect(result.position).toBeCloseTo(15, 5);
      // Velocity should be non-zero at midpoint
      expect(Math.abs(result.velocity)).toBeGreaterThan(0);
    });
  });

  describe('calculateCamProfile', () => {
    it('should calculate cam profile for linear curve', () => {
      // Arrange
      const x = 5;
      const segment = {
        x1: 0,
        y1: 10,
        v1: 0,
        a1: 0,
        x2: 10,
        y2: 20,
        v2: 0,
        a2: 0,
        curveType: 'Linear'
      };

      // Spy sur la fonction calculateLinear
      const calculateLinearSpy = jest.spyOn(camCalculations, 'calculateLinear');
      calculateLinearSpy.mockReturnValue({
        position: 15,
        velocity: 1,
        acceleration: 0
      });

      // Act
      const result = camCalculations.calculateCamProfile(x, segment);

      // Assert
      expect(calculateLinearSpy).toHaveBeenCalled();
      expect(result).not.toBeNull();
      
      // Restaurer l'implémentation originale
      calculateLinearSpy.mockRestore();
    });

    it('should return null if x is outside segment range', () => {
      // Arrange
      const x = 15;
      const segment = {
        x1: 0,
        y1: 10,
        v1: 0,
        a1: 0,
        x2: 10,
        y2: 20,
        v2: 0,
        a2: 0,
        curveType: 'LINEAR'
      };

      // Act
      const result = camCalculations.calculateCamProfile(x, segment);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('calculateCamProfileRange', () => {
    it('should calculate cam profile for a range of values', () => {
      // Arrange
      const start = 0;
      const end = 10;
      const step = 5;
      const segments = [
        {
          x1: 0,
          y1: 10,
          v1: 0,
          a1: 0,
          x2: 10,
          y2: 20,
          v2: 0,
          a2: 0,
          curveType: 'Linear'
        }
      ];

      // Créer un mock pour la fonction calculateCamProfile
      const calculateCamProfileSpy = jest.spyOn(camCalculations, 'calculateCamProfile');
      calculateCamProfileSpy.mockImplementation((x, segment) => {
        if (x === 0) return { position: 10, velocity: 1, acceleration: 0, x: 0 };
        if (x === 5) return { position: 15, velocity: 1, acceleration: 0, x: 5 };
        if (x === 10) return { position: 20, velocity: 1, acceleration: 0, x: 10 };
        return null;
      });

      // Act
      const result = camCalculations.calculateCamProfileRange(start, end, step, segments);

      // Assert
      expect(result.length).toBe(3); // 0, 5, 10
      expect(calculateCamProfileSpy).toHaveBeenCalledTimes(3);
      
      // Restaurer la fonction originale
      calculateCamProfileSpy.mockRestore();
    });
  });
}); 