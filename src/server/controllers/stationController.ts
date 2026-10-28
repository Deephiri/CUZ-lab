import { Request, Response } from 'express';
import { StationService } from '../services/stationService.ts';

export class StationController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const stations = await StationService.getAllStations();
      res.json({ success: true, stations });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getByCode(req: Request, res: Response): Promise<void> {
    try {
      const code = req.params.code;
      const station = await StationService.getStationByCode(code);
      if (!station) {
        res.status(404).json({
          success: false,
          error: `Station "${code}" was not found. Please verify the QR code or station identifier at your lab counter.`,
        });
        return;
      }
      res.json({ success: true, station });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { stationCode, labName, locationDescription } = req.body;
      if (!stationCode || !labName) {
        res.status(400).json({ success: false, error: 'Station code and lab name are required' });
        return;
      }

      const station = await StationService.createStation(stationCode, labName, locationDescription);
      res.status(201).json({ success: true, message: 'Station created successfully', station });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getQR(req: Request, res: Response): Promise<void> {
    try {
      const code = req.params.code;
      // Determine host from headers or env
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
      const hostUrl = `${protocol}://${host}`;

      const qr = await StationService.generateStationQR(code, hostUrl);
      res.json({ success: true, ...qr });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}
