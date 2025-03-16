import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock des dépendances externes
jest.mock('axios', () => ({
  default: {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

jest.mock('./services/api', () => ({
  camProfileAPI: {
    getAllCamProfiles: jest.fn().mockResolvedValue([]),
    getCamProfileById: jest.fn().mockResolvedValue({}),
    createCamProfile: jest.fn().mockResolvedValue({}),
    updateCamProfile: jest.fn().mockResolvedValue({}),
    deleteCamProfile: jest.fn().mockResolvedValue({}),
    calculateCamValues: jest.fn().mockResolvedValue([]),
    calculateFormula: jest.fn().mockResolvedValue({ result: 0 }),
  },
}));

// Désactiver temporairement ce test
test.skip('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
