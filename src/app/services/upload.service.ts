import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import PocketBase from 'pocketbase';
import { GlobalService } from './global.service';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  public pb: PocketBase;

  constructor(
    public global: GlobalService
  ) {
    this.pb = new PocketBase('https://db.buckapi.com:8095');
  }

  uploadToActivityWorkInstruction(file: File, activityData: any): Observable<any> {
    return from(this.addProductRecord(file, activityData));
  }

  public async addProductRecord(file: File, activityData: any): Promise<any> {
    try {
      const formData = new FormData();
      
      // Agregar el archivo
      formData.append('file', file);
      
      // Agregar los campos del formulario
      formData.append('number', activityData.number || new Date().getTime().toString());
      formData.append('date', activityData.date || new Date().toISOString());
      formData.append('process', activityData.process || 'Image Upload');
      formData.append('description', activityData.description || 'Image uploaded from work instruction');
      formData.append('focusPoints', activityData.focusPoints || '');
      formData.append('workinstructionId', activityData.workinstructionId);
      formData.append('technicalId', activityData.technicalId);
      formData.append('supervisorId', activityData.supervisorId);
      formData.append('time', activityData.time || new Date().toISOString());
      
      // Crear el registro
      const record = await this.pb.collection('productsInventory').create(formData);
      
      return {
        url: this.pb.files.getUrl(record, record['file']),
        id: record.id,
        filename: record['file'],
        success: true,
        record: record
      };
    } catch (error) {
      console.error('Error creating activity record:', error);
      throw error;
    }
  }

  public async createProductRecord(file: File, productData: any): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', productData.name || '');
      formData.append('description', productData.description || '');
      formData.append('price', productData.price || '');
      formData.append('idCategoria', productData.idCategoria || '');
      formData.append('code', productData.code || '');
      formData.append('unity', productData.unity || '');
      formData.append('stock', productData.stock || '');

      const record = await this.pb.collection('productsInventory').create(formData);

      return {
        url: this.pb.files.getUrl(record, record['file']),
        id: record.id,
        filename: record['file'],
        success: true,
        record: record
      };
    } catch (error) {
      console.error('Error creating product record:', error);
      throw error;
    }
  }

  getFileUrl(record: any): string {
    return this.pb.files.getUrl(record, record['file']);
  }
}
