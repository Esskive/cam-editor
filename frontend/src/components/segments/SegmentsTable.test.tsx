import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SegmentsTable from './SegmentsTable';
import { CamProfile, Segment, CurveType } from '../../types';
import { camProfileAPI } from '../../services/api';

// Mock des dépendances
jest.mock('../../services/api', () => ({
  camProfileAPI: {
    updateCamProfile: jest.fn().mockResolvedValue({ success: true }),
    deleteSegment: jest.fn().mockResolvedValue({ success: true }),
    addSegment: jest.fn().mockResolvedValue({ 
      success: true, 
      segment: { 
        _id: 'new-segment-id', 
        x1: 0,
        y1: 10,
        v1: 0,
        a1: 0,
        x2: 90,
        y2: 20,
        v2: 0,
        a2: 0,
        curveType: 'Linear' 
      } 
    }),
    updateSegment: jest.fn().mockResolvedValue({ success: true }),
  }
}));

describe('SegmentsTable Component', () => {
  const mockSegment: Segment = {
    _id: 'segment-1',
    x1: 0,
    y1: 10,
    v1: 0,
    a1: 0,
    x2: 90,
    y2: 20,
    v2: 0,
    a2: 0,
    curveType: 'Linear'
  };

  const mockCamProfile: CamProfile = {
    _id: '123',
    name: 'Test Profile',
    description: 'Test Description',
    segments: [mockSegment],
    spreadsheetData: [],
    masterUnit: 'deg',
    slaveUnit: 'mm',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockOnProfileUpdate = jest.fn();
  const mockOnLinkParameter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders segments table with correct data', () => {
    render(
      <SegmentsTable 
        camProfile={mockCamProfile} 
        onProfileUpdate={mockOnProfileUpdate}
        onLinkParameter={mockOnLinkParameter}
      />
    );
    
    // Vérifier que le titre est affiché
    expect(screen.getByText('Segments Table')).toBeInTheDocument();
    
    // Vérifier que les en-têtes du tableau sont affichés
    expect(screen.getByText('X1')).toBeInTheDocument();
    expect(screen.getByText('Y1')).toBeInTheDocument();
    expect(screen.getByText('X2')).toBeInTheDocument();
    expect(screen.getByText('Y2')).toBeInTheDocument();
    expect(screen.getByText('Curve Type')).toBeInTheDocument();
    
    // Vérifier que le segment est affiché (numéro de ligne)
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('handles empty cam profile', () => {
    render(
      <SegmentsTable 
        camProfile={null} 
        onProfileUpdate={mockOnProfileUpdate}
      />
    );
    
    // Vérifier qu'un message approprié est affiché
    expect(screen.getByText('No segments found. Add a segment to get started.')).toBeInTheDocument();
  });

  test('opens add segment dialog when add button is clicked', async () => {
    render(
      <SegmentsTable 
        camProfile={mockCamProfile} 
        onProfileUpdate={mockOnProfileUpdate}
      />
    );
    
    // Cliquer sur le bouton d'ajout
    fireEvent.click(screen.getByText('Add Segment'));
    
    // Vérifier que la boîte de dialogue est affichée
    await waitFor(() => {
      expect(screen.getByText('Add Segment')).toBeInTheDocument();
    });
  });

  // Autres tests à implémenter:
  // - Test d'ajout d'un segment
  // - Test de suppression d'un segment
  // - Test de modification d'un segment
  // - Test de liaison de paramètres
}); 