import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CamSpreadsheet } from './CamSpreadsheet';
import { CamProfile, Segment, SpreadsheetCell } from '../../types';
import { camProfileAPI } from '../../services/api';

// Mock des API
jest.mock('../../services/api', () => ({
  camProfileAPI: {
    updateSpreadsheetData: jest.fn().mockResolvedValue({}),
  }
}));

describe('CamSpreadsheet Component', () => {
  // Données de test
  const mockSegment: Segment = {
    _id: 'segment-1',
    x1: 0,
    y1: 10,
    v1: 0,
    a1: 0,
    x2: 90,
    y2: 20,
    v2: 2,
    a2: 1,
    curveType: 'Linear'
  };

  const createMockProfile = (withLinkedCells: boolean = false): CamProfile => {
    // Créer des cellules de base
    const cells: SpreadsheetCell[][] = Array(5).fill(null).map(() => 
      Array(5).fill(null).map(() => ({ value: '' }))
    );
    
    // Si demandé, ajouter une cellule liée
    if (withLinkedCells) {
      cells[1][1] = {
        value: '20',
        linkedSegments: [{ segmentIndex: 0, parameter: 'y2' }],
        calculatedValue: 20
      };
    }
    
    return {
      _id: '123',
      name: 'Test Profile',
      description: 'Test Description',
      masterUnit: 'deg',
      slaveUnit: 'mm',
      segments: [mockSegment],
      spreadsheetData: cells,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  };

  it('renders spreadsheet with correct headers', () => {
    const mockProfile = createMockProfile();
    const handleUpdate = jest.fn();
    
    render(
      <CamSpreadsheet 
        camProfile={mockProfile} 
        onProfileUpdate={handleUpdate} 
      />
    );
    
    // Vérifier que les en-têtes A, B, C sont présents
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    
    // Vérifier que le titre est affiché
    expect(screen.getByText('Feuille de calcul')).toBeInTheDocument();
    
    // Vérifier que le bouton de sauvegarde est présent
    expect(screen.getByText('Enregistrer')).toBeInTheDocument();
  });

  it('handles empty cam profile', () => {
    render(
      <CamSpreadsheet 
        camProfile={null} 
        onProfileUpdate={jest.fn()} 
      />
    );
    
    // Vérifier que le tableau est toujours affiché même sans profil
    expect(screen.getByText('Feuille de calcul')).toBeInTheDocument();
    
    // Le bouton de sauvegarde devrait être désactivé
    const saveButton = screen.getByText('Enregistrer');
    expect(saveButton).toBeInTheDocument();
    expect(saveButton.closest('button')).toBeDisabled();
  });
  
  // Note: Les tests plus complexes pour les liaisons entre cellules et segments
  // nécessiteraient des mocks plus avancés et une configuration spécifique
  // pour simuler les interactions utilisateur avec le composant Spreadsheet.
  // Ces tests pourraient être ajoutés ultérieurement.
}); 