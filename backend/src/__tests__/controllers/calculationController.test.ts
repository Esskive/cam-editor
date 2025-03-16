import { Request, Response } from 'express';
import * as calculationController from '../../controllers/calculationController';
import * as camProfileController from '../../controllers/camProfileController';
import * as camCalculations from '../../utils/camCalculations';

// Mock des dépendances
jest.mock('../../utils/camCalculations', () => ({
  calculateCamProfileRange: jest.fn(),
  calculateCamProfile: jest.fn()
}));

// Mock de Request et Response
const mockRequest = () => {
  const req: Partial<Request> = {};
  req.body = {};
  req.params = {};
  return req as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res as Response;
};

describe('Calculation Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Réinitialiser les données de test
    camProfileController.camProfiles.length = 0;
  });

  describe('calculateCamValues', () => {
    it('should calculate cam values for a given range', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = {
        id: '1',
        start: '0',
        end: '360',
        step: '10'
      };
      
      const mockProfile = {
        _id: '1',
        name: 'Test Profile',
        segments: [
          { startAngle: 0, endAngle: 90, startRadius: 10, endRadius: 20 }
        ]
      };
      
      // Ajouter le profil de test
      camProfileController.camProfiles.push(mockProfile);
      
      const mockResult = [
        { angle: 0, radius: 10 },
        { angle: 10, radius: 11.1 }
      ];
      
      // Utiliser une conversion de type pour éviter l'erreur
      const calculateCamProfileRangeMock = camCalculations.calculateCamProfileRange as unknown as jest.Mock;
      calculateCamProfileRangeMock.mockReturnValue(mockResult);

      // Act
      await calculationController.calculateCamValues(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(calculateCamProfileRangeMock).toHaveBeenCalledWith(
        0, 360, 10, mockProfile.segments
      );
    });

    it('should return 404 if cam profile not found', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = {
        id: '999',
        start: '0',
        end: '360',
        step: '10'
      };
      
      // Ajouter un profil de test différent
      camProfileController.camProfiles.push({ _id: '1', name: 'Test Profile' });

      // Act
      await calculationController.calculateCamValues(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Cam profile not found'
      }));
    });

    it('should return 400 if parameters are invalid', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = {
        id: '1',
        start: 'invalid',
        end: '360',
        step: '10'
      };
      
      // Ajouter un profil de test
      camProfileController.camProfiles.push({ _id: '1', name: 'Test Profile' });

      // Act
      await calculationController.calculateCamValues(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid parameters'
      }));
    });

    it('should handle errors and return 500', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = {
        id: '1',
        start: '0',
        end: '360',
        step: '10'
      };
      
      // Ajouter un profil de test
      camProfileController.camProfiles.push({ _id: '1', name: 'Test Profile' });
      
      // Simuler une erreur
      const calculateCamProfileRangeMock = camCalculations.calculateCamProfileRange as unknown as jest.Mock;
      calculateCamProfileRangeMock.mockImplementation(() => {
        throw new Error('Test error');
      });

      // Act
      await calculationController.calculateCamValues(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error calculating cam values'
      }));
    });
  });

  describe('calculateCamValueAtPoint', () => {
    it('should calculate cam value at a specific point', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = {
        id: '1',
        point: '45'
      };
      
      const mockSegment = {
        x1: 0,
        x2: 90,
        y1: 10,
        y2: 20,
        v1: 0,
        v2: 0,
        a1: 0,
        a2: 0,
        curveType: 'Linear'
      };
      
      const mockProfile = {
        _id: '1',
        name: 'Test Profile',
        segments: [mockSegment]
      };
      
      // Ajouter le profil de test
      camProfileController.camProfiles.push(mockProfile);
      
      const mockResult = {
        position: 15,
        velocity: 0.1,
        acceleration: 0
      };
      
      // Utiliser une conversion de type pour éviter l'erreur
      const calculateCamProfileMock = camCalculations.calculateCamProfile as unknown as jest.Mock;
      calculateCamProfileMock.mockReturnValue(mockResult);

      // Act
      await calculationController.calculateCamValueAtPoint(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        x: 45,
        ...mockResult
      });
      expect(calculateCamProfileMock).toHaveBeenCalledWith(45, mockSegment);
    });

    it('should return 404 if cam profile not found', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = {
        id: '999',
        point: '45'
      };
      
      // Ajouter un profil de test différent
      camProfileController.camProfiles.push({ _id: '1', name: 'Test Profile' });

      // Act
      await calculationController.calculateCamValueAtPoint(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Cam profile not found'
      }));
    });

    it('should return 400 if point parameter is invalid', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = {
        id: '1',
        point: 'invalid'
      };
      
      // Ajouter un profil de test
      camProfileController.camProfiles.push({ _id: '1', name: 'Test Profile' });

      // Act
      await calculationController.calculateCamValueAtPoint(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid point parameter'
      }));
    });

    it('should return 404 if no segment found for the given point', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = {
        id: '1',
        point: '100'
      };
      
      const mockProfile = {
        _id: '1',
        name: 'Test Profile',
        segments: [
          { x1: 0, x2: 90, y1: 10, y2: 20, v1: 0, v2: 0, a1: 0, a2: 0, curveType: 'Linear' }
        ]
      };
      
      // Ajouter le profil de test
      camProfileController.camProfiles.push(mockProfile);

      // Act
      await calculationController.calculateCamValueAtPoint(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'No segment found for the given point'
      }));
    });

    it('should return 404 if calculation returns null', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = {
        id: '1',
        point: '45'
      };
      
      const mockSegment = {
        x1: 0,
        x2: 90,
        y1: 10,
        y2: 20,
        v1: 0,
        v2: 0,
        a1: 0,
        a2: 0,
        curveType: 'Linear'
      };
      
      const mockProfile = {
        _id: '1',
        name: 'Test Profile',
        segments: [mockSegment]
      };
      
      // Ajouter le profil de test
      camProfileController.camProfiles.push(mockProfile);
      
      // Simuler un résultat null
      const calculateCamProfileMock = camCalculations.calculateCamProfile as unknown as jest.Mock;
      calculateCamProfileMock.mockReturnValue(null);

      // Act
      await calculationController.calculateCamValueAtPoint(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Could not calculate values for the given point'
      }));
    });

    it('should handle errors and return 500', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = {
        id: '1',
        point: '45'
      };
      
      // Simuler une erreur
      jest.spyOn(camProfileController.camProfiles, 'find').mockImplementation(() => {
        throw new Error('Test error');
      });

      // Act
      await calculationController.calculateCamValueAtPoint(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error calculating cam value at point'
      }));
    });
  });

  describe('calculateCurves', () => {
    it('should calculate curves for given segments', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      
      const mockSegments = [
        {
          x1: 0,
          x2: 90,
          y1: 10,
          y2: 20,
          v1: 0,
          v2: 0,
          a1: 0,
          a2: 0,
          curveType: 'Linear'
        }
      ];
      
      req.body = {
        segments: mockSegments,
        resolution: 100
      };
      
      const mockResult = [
        { x: 0, position: 10, velocity: 0, acceleration: 0 },
        { x: 45, position: 15, velocity: 0.1, acceleration: 0 },
        { x: 90, position: 20, velocity: 0, acceleration: 0 }
      ];
      
      // Utiliser une conversion de type pour éviter l'erreur
      const calculateCamProfileRangeMock = camCalculations.calculateCamProfileRange as unknown as jest.Mock;
      calculateCamProfileRangeMock.mockReturnValue(mockResult);

      // Act
      await calculationController.calculateCurves(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(calculateCamProfileRangeMock).toHaveBeenCalledWith(
        0, 90, 0.9, expect.any(Array)
      );
    });

    it('should return 400 if segments are invalid', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      
      req.body = {
        segments: null,
        resolution: 100
      };

      // Act
      await calculationController.calculateCurves(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Valid segments array is required'
      }));
    });

    it('should return 400 if segments array is empty', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      
      req.body = {
        segments: [],
        resolution: 100
      };

      // Act
      await calculationController.calculateCurves(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Valid segments array is required'
      }));
    });

    it('should handle errors and return 500', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      
      const mockSegments = [
        {
          x1: 0,
          x2: 90,
          y1: 10,
          y2: 20,
          v1: 0,
          v2: 0,
          a1: 0,
          a2: 0,
          curveType: 'Linear'
        }
      ];
      
      req.body = {
        segments: mockSegments,
        resolution: 100
      };
      
      // Simuler une erreur
      const calculateCamProfileRangeMock = camCalculations.calculateCamProfileRange as unknown as jest.Mock;
      calculateCamProfileRangeMock.mockImplementation(() => {
        throw new Error('Test error');
      });

      // Act
      await calculationController.calculateCurves(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error calculating curves'
      }));
    });
  });
}); 