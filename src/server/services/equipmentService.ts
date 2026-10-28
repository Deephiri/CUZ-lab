import { getDB } from '../db/index.ts';

export interface EquipmentItem {
  equipment_id: number;
  object_name: string;
  category: string;
  total_quantity: number;
  available_quantity: number;
  status: 'active' | 'maintenance' | 'retired';
  model_or_specs?: string;
  created_at?: string;
  updated_at?: string;
}

export class EquipmentService {
  /**
   * Get equipment available for student borrowing (active & stock > 0)
   */
  static async getAvailableCatalog(): Promise<EquipmentItem[]> {
    const db = getDB();
    return await db.query<EquipmentItem>(
      `SELECT equipment_id, object_name, category, total_quantity, available_quantity, status, model_or_specs
       FROM equipment
       WHERE status = 'active' AND available_quantity > 0
       ORDER BY category ASC, object_name ASC`
    );
  }

  /**
   * Get all equipment items (for staff / admin inventory control)
   */
  static async getAllEquipment(category?: string, status?: string): Promise<EquipmentItem[]> {
    const db = getDB();
    let sql = 'SELECT * FROM equipment WHERE 1=1';
    const params: any[] = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY category ASC, object_name ASC';
    return await db.query<EquipmentItem>(sql, params);
  }

  /**
   * Get single item
   */
  static async getEquipmentById(id: number): Promise<EquipmentItem | null> {
    const db = getDB();
    const rows = await db.query<EquipmentItem>('SELECT * FROM equipment WHERE equipment_id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Add new equipment to inventory
   */
  static async createEquipment(data: {
    objectName: string;
    category: string;
    totalQuantity: number;
    availableQuantity?: number;
    status?: 'active' | 'maintenance' | 'retired';
    modelOrSpecs?: string;
  }): Promise<EquipmentItem> {
    const db = getDB();
    const total = Number(data.totalQuantity) || 1;
    const available = data.availableQuantity !== undefined ? Number(data.availableQuantity) : total;

    if (available > total || available < 0) {
      throw new Error('Available quantity must be between 0 and total quantity');
    }

    const res = await db.execute(
      `INSERT INTO equipment (object_name, category, total_quantity, available_quantity, status, model_or_specs)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.objectName.trim(),
        data.category.trim(),
        total,
        available,
        data.status || 'active',
        data.modelOrSpecs || '',
      ]
    );

    const created = await this.getEquipmentById(res.insertId!);
    return created!;
  }

  /**
   * Update equipment details
   */
  static async updateEquipment(
    id: number,
    data: {
      objectName?: string;
      category?: string;
      totalQuantity?: number;
      availableQuantity?: number;
      status?: 'active' | 'maintenance' | 'retired';
      modelOrSpecs?: string;
    }
  ): Promise<EquipmentItem> {
    const current = await this.getEquipmentById(id);
    if (!current) {
      throw new Error('Equipment item not found');
    }

    const total = data.totalQuantity !== undefined ? Number(data.totalQuantity) : current.total_quantity;
    const available = data.availableQuantity !== undefined ? Number(data.availableQuantity) : current.available_quantity;

    if (available > total || available < 0) {
      throw new Error('Available quantity must be between 0 and total quantity');
    }

    const db = getDB();
    await db.execute(
      `UPDATE equipment
       SET object_name = ?, category = ?, total_quantity = ?, available_quantity = ?, status = ?, model_or_specs = ?
       WHERE equipment_id = ?`,
      [
        data.objectName !== undefined ? data.objectName.trim() : current.object_name,
        data.category !== undefined ? data.category.trim() : current.category,
        total,
        available,
        data.status !== undefined ? data.status : current.status,
        data.modelOrSpecs !== undefined ? data.modelOrSpecs : current.model_or_specs,
        id,
      ]
    );

    const updated = await this.getEquipmentById(id);
    return updated!;
  }

  /**
   * Adjust stock levels directly
   */
  static async adjustStock(id: number, delta: number, adjustTotalToo: boolean = true): Promise<EquipmentItem> {
    const db = getDB();
    return await db.withTransaction(async tx => {
      const rows = await tx.query<EquipmentItem>('SELECT * FROM equipment WHERE equipment_id = ? FOR UPDATE', [id]);
      if (rows.length === 0) throw new Error('Equipment item not found');
      const item = rows[0];

      const newAvail = item.available_quantity + delta;
      const newTotal = adjustTotalToo ? item.total_quantity + delta : item.total_quantity;

      if (newAvail < 0) throw new Error('Cannot reduce stock below 0 available units');
      if (newAvail > newTotal) throw new Error('Available units cannot exceed total units');

      await tx.execute(
        'UPDATE equipment SET available_quantity = ?, total_quantity = ? WHERE equipment_id = ?',
        [newAvail, newTotal, id]
      );

      const [res] = await tx.query<EquipmentItem>('SELECT * FROM equipment WHERE equipment_id = ?', [id]);
      return res;
    });
  }
}
