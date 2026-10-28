import { Request, Response } from 'express';
import { EquipmentService } from '../services/equipmentService.ts';

export class EquipmentController {
  static async getCatalog(req: Request, res: Response): Promise<void> {
    try {
      const showAll = req.query.all === 'true' && (req.user?.role === 'technician' || req.user?.role === 'admin');
      const category = req.query.category as string | undefined;
      const status = req.query.status as string | undefined;

      if (showAll) {
        const items = await EquipmentService.getAllEquipment(category, status);
        res.json({ success: true, items });
      } else {
        const items = await EquipmentService.getAvailableCatalog();
        res.json({ success: true, items });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const item = await EquipmentService.getEquipmentById(id);
      if (!item) {
        res.status(404).json({ success: false, error: 'Equipment item not found' });
        return;
      }
      res.json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { objectName, category, totalQuantity, availableQuantity, status, modelOrSpecs } = req.body;
      if (!objectName || !category) {
        res.status(400).json({ success: false, error: 'Equipment name and category are required' });
        return;
      }

      const item = await EquipmentService.createEquipment({
        objectName,
        category,
        totalQuantity,
        availableQuantity,
        status,
        modelOrSpecs,
      });

      res.status(201).json({ success: true, message: 'Equipment added to inventory', item });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const item = await EquipmentService.updateEquipment(id, req.body);
      res.json({ success: true, message: 'Equipment updated successfully', item });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async adjustStock(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { delta, adjustTotalToo } = req.body;
      if (typeof delta !== 'number') {
        res.status(400).json({ success: false, error: 'Delta numeric value required (+1, -1, etc.)' });
        return;
      }

      const item = await EquipmentService.adjustStock(id, delta, adjustTotalToo ?? true);
      res.json({ success: true, message: 'Stock adjusted successfully', item });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}
