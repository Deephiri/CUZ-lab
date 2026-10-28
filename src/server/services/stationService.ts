import QRCode from 'qrcode';
import { getDB } from '../db/index.ts';

export interface Station {
  station_id: number;
  station_code: string;
  lab_name: string;
  location_description?: string;
  created_at?: string;
}

export class StationService {
  /**
   * Get all active stations
   */
  static async getAllStations(): Promise<Station[]> {
    const db = getDB();
    return await db.query<Station>('SELECT * FROM stations ORDER BY station_code ASC');
  }

  /**
   * Find station by its code (e.g. STN-MAIN-01)
   */
  static async getStationByCode(stationCode: string): Promise<Station | null> {
    const db = getDB();
    const rows = await db.query<Station>(
      'SELECT * FROM stations WHERE LOWER(station_code) = ? LIMIT 1',
      [stationCode.trim().toLowerCase()]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create a new station
   */
  static async createStation(stationCode: string, labName: string, locationDescription?: string): Promise<Station> {
    const db = getDB();
    const code = stationCode.trim().toUpperCase();
    const existing = await this.getStationByCode(code);
    if (existing) {
      throw new Error(`Station code ${code} already exists`);
    }

    const res = await db.execute(
      'INSERT INTO stations (station_code, lab_name, location_description) VALUES (?, ?, ?)',
      [code, labName.trim(), locationDescription || '']
    );

    const station = await this.getStationByCode(code);
    return station!;
  }

  /**
   * Generate static QR code URL and image for this station
   * Encodes: https://<host>/borrow?station=<station_code>
   */
  static async generateStationQR(
    stationCode: string,
    hostUrl: string
  ): Promise<{
    url: string;
    dataUrl: string;
    svg: string;
    station: Station;
  }> {
    const station = await this.getStationByCode(stationCode);
    if (!station) {
      throw new Error(`Invalid station code: ${stationCode}. Please verify the lab counter identifier.`);
    }

    const cleanHost = (hostUrl || 'http://localhost:3000').replace(/\/+$/, '');
    const borrowUrl = `${cleanHost}/borrow?station=${encodeURIComponent(station.station_code)}`;

    const dataUrl = await QRCode.toDataURL(borrowUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#1e3a8a', // Cavendish Deep Blue
        light: '#ffffff',
      },
    });

    const svg = await QRCode.toString(borrowUrl, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff',
      },
    });

    return {
      url: borrowUrl,
      dataUrl,
      svg,
      station,
    };
  }
}
