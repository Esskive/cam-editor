import { Request, Response } from 'express';
import * as camProfileController from '../../controllers/camProfileController';

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

describe('Cam Profile Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Réinitialiser les données de test
    camProfileController.camProfiles.length = 0;
  });

  describe('getAllCamProfiles', () => {
    it('should return all cam profiles', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      
      // Ajouter des profils de test
      camProfileController.camProfiles.push(
        { _id: '1', name: 'Profile 1' },
        { _id: '2', name: 'Profile 2' }
      );

      // Act
      await camProfileController.getAllCamProfiles(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(camProfileController.camProfiles);
    });

    it('should handle errors', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      jest.spyOn(res, 'status').mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      // Act
      await camProfileController.getAllCamProfiles(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error fetching cam profiles'
      }));
    });
  });

  describe('getCamProfileById', () => {
    it('should return a cam profile by id', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: '1' };
      
      // Ajouter des profils de test
      const testProfile = { _id: '1', name: 'Profile 1' };
      camProfileController.camProfiles.push(
        testProfile,
        { _id: '2', name: 'Profile 2' }
      );

      // Act
      await camProfileController.getCamProfileById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(testProfile);
    });

    it('should return 404 if profile not found', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: '999' };
      
      // Ajouter des profils de test
      camProfileController.camProfiles.push(
        { _id: '1', name: 'Profile 1' },
        { _id: '2', name: 'Profile 2' }
      );

      // Act
      await camProfileController.getCamProfileById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Cam profile not found'
      }));
    });
  });

  describe('createCamProfile', () => {
    it('should create a new cam profile', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.body = {
        name: 'New Profile',
        description: 'Test Description',
        segments: []
      };

      // Act
      await camProfileController.createCamProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Profile',
        description: 'Test Description'
      }));
      expect(camProfileController.camProfiles.length).toBe(1);
    });
  });

  describe('updateCamProfile', () => {
    it('should update an existing cam profile', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: '1' };
      req.body = {
        name: 'Updated Profile',
        description: 'Updated Description'
      };
      
      // Ajouter un profil de test
      camProfileController.camProfiles.push({
        _id: '1',
        name: 'Original Profile',
        description: 'Original Description',
        segments: []
      });

      // Act
      await camProfileController.updateCamProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        _id: '1',
        name: 'Updated Profile',
        description: 'Updated Description'
      }));
    });

    it('should return 404 if profile to update not found', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: '999' };
      req.body = {
        name: 'Updated Profile'
      };
      
      // Ajouter un profil de test différent
      camProfileController.camProfiles.push({ _id: '1', name: 'Original Profile' });

      // Act
      await camProfileController.updateCamProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Cam profile not found'
      }));
    });
  });

  describe('deleteCamProfile', () => {
    it('should delete an existing cam profile', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: '1' };
      
      // Ajouter des profils de test
      camProfileController.camProfiles.push(
        { _id: '1', name: 'Profile 1' },
        { _id: '2', name: 'Profile 2' }
      );

      // Act
      await camProfileController.deleteCamProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Cam profile deleted successfully'
      }));
      expect(camProfileController.camProfiles.length).toBe(1);
      expect(camProfileController.camProfiles[0]._id).toBe('2');
    });

    it('should return 404 if profile to delete not found', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: '999' };
      
      // Ajouter un profil de test différent
      camProfileController.camProfiles.push({ _id: '1', name: 'Profile 1' });

      // Act
      await camProfileController.deleteCamProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Cam profile not found'
      }));
      expect(camProfileController.camProfiles.length).toBe(1);
    });
  });

  describe('addSegment', () => {
    it('should add a segment to an existing cam profile', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: '1' };
      req.body = {
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
      
      // Ajouter un profil de test
      camProfileController.camProfiles.push({
        _id: '1',
        name: 'Test Profile',
        segments: []
      });

      // Act
      await camProfileController.addSegment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        _id: '1',
        name: 'Test Profile',
        segments: expect.arrayContaining([
          expect.objectContaining({
            x1: 0,
            y1: 10,
            curveType: 'Linear'
          })
        ])
      }));
      expect(camProfileController.camProfiles[0].segments.length).toBe(1);
    });

    it('should ensure continuity when adding a second segment', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: '1' };
      
      // Ajouter un profil de test avec un segment existant
      camProfileController.camProfiles.push({
        _id: '1',
        name: 'Test Profile',
        segments: [
          {
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
          }
        ]
      });

      // Simuler l'ajout d'un second segment
      req.body = {
        x1: 90,  // Devrait être égal au x2 du segment précédent
        y1: 20,  // Devrait être égal au y2 du segment précédent
        v1: 2,   // Devrait être égal au v2 du segment précédent
        a1: 1,   // Devrait être égal au a2 du segment précédent
        x2: 180,
        y2: 30,
        v2: 0,
        a2: 0,
        curveType: 'Polynomial3'
      };

      // Act
      await camProfileController.addSegment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(camProfileController.camProfiles[0].segments.length).toBe(2);
      
      // Vérifier la continuité entre les segments
      const segments = camProfileController.camProfiles[0].segments;
      const firstSegment = segments[0];
      const secondSegment = segments[1];
      
      expect(secondSegment.x1).toBe(firstSegment.x2);
      expect(secondSegment.y1).toBe(firstSegment.y2);
      expect(secondSegment.v1).toBe(firstSegment.v2);
      expect(secondSegment.a1).toBe(firstSegment.a2);
    });

    it('should return 404 if profile for adding segment not found', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: '999' };
      req.body = {
        x1: 0,
        y1: 10
      };
      
      // Ajouter un profil de test différent
      camProfileController.camProfiles.push({ _id: '1', name: 'Test Profile', segments: [] });

      // Act
      await camProfileController.addSegment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Cam profile not found'
      }));
    });
  });

  describe('updateSegment', () => {
    it('should update a segment and maintain continuity with adjacent segments', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: '1', segmentId: 'segment-2' };
      
      // Ajouter un profil de test avec trois segments consécutifs
      camProfileController.camProfiles.push({
        _id: '1',
        name: 'Test Profile',
        segments: [
          {
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
          },
          {
            _id: 'segment-2',
            x1: 90,
            y1: 20,
            v1: 2,
            a1: 1,
            x2: 180,
            y2: 30,
            v2: 3,
            a2: 2,
            curveType: 'Polynomial3'
          },
          {
            _id: 'segment-3',
            x1: 180,
            y1: 30,
            v1: 3,
            a1: 2,
            x2: 270,
            y2: 40,
            v2: 0,
            a2: 0,
            curveType: 'Linear'
          }
        ]
      });

      // Simuler la mise à jour du segment du milieu
      req.body = {
        y2: 35,  // Changer uniquement la position finale
        v2: 4,   // et la vitesse finale
        curveType: 'Sine'
      };

      // Act
      await camProfileController.updateSegment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      
      // Vérifier que le segment a été mis à jour
      const segments = camProfileController.camProfiles[0].segments;
      const updatedSegment = segments[1];
      expect(updatedSegment.y2).toBe(35);
      expect(updatedSegment.v2).toBe(4);
      expect(updatedSegment.curveType).toBe('Sine');
      
      // Vérifier que la continuité est maintenue avec le segment suivant
      const nextSegment = segments[2];
      expect(nextSegment.x1).toBe(updatedSegment.x2);
      expect(nextSegment.y1).toBe(updatedSegment.y2);
      expect(nextSegment.v1).toBe(updatedSegment.v2);
      expect(nextSegment.a1).toBe(updatedSegment.a2);
    });
  });
}); 