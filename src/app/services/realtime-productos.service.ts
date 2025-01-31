import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RealtimeProductsService implements OnDestroy {
  private pb: PocketBase;
  private productsSubject = new BehaviorSubject<any[]>([]);

  // Esta es la propiedad que expondrá el Observable para que los componentes puedan suscribirse a ella
  public products$: Observable<any[]> =
    this.productsSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.buckapi.com:8095');
    this.subscribeToProducts();
  }

  private async subscribeToProducts() {
    // (Opcional) Autenticación
    await this.pb
      .collection('users')
      .authWithPassword('admin@email.com', 'admin1234');

    // Suscribirse a cambios en cualquier registro de la colección 'supervisors'
    this.pb.collection('productsInventory').subscribe('*', (e) => {
      this.handleRealtimeEvent(e);
    });

    // Inicializar la lista de productos
    this.updateProductsList();
  }

  private handleRealtimeEvent(event: any) {
    // Aquí puedes manejar las acciones 'create', 'update' y 'delete'
    console.log(event.action);
    console.log(event.record);

    // Actualizar la lista de productos
    this.updateProductsList();
  }

  private async updateProductsList() {
    // Obtener la lista actualizada de productos
    const records = await this.pb
      .collection('productsInventory')
      .getFullList(200 /* cantidad máxima de registros */, {
        sort: '-created', // Ordenar por fecha de creación
      });
    this.productsSubject.next(records);
  }

  ngOnDestroy() {
    // Desuscribirse cuando el servicio se destruye
    this.pb.collection('productsInventory').unsubscribe('*');
  }
  // Nuevo método para actualizar el stock de un producto
  /* async updateProductStock(producto: any): Promise<void> {
    try {
      // Se hace un "update" del producto en la colección, especificando el ID del producto
      await this.pb.collection('productsInventory').update(producto.id, {
        unity: producto.unity,
      });

      console.log(`Producto ${producto.name} actualizado correctamente`);

      // Después de actualizar, podemos actualizar la lista de productos en el frontend
      this.updateProductsList();
    } catch (error) {
      console.error('Error al actualizar el producto:', error);
      throw new Error('Error al actualizar el producto');
    }
  } */
  // Método para actualizar el stock de un producto
  async updateProductStock(producto: any): Promise<void> {
    try {
      // Actualizamos solo la cantidad del producto (campo 'unity')
      const updatedData = {
        unity: producto.unity, // Usamos la nueva cantidad después de la venta
      };

      // Realizamos la actualización del producto en la base de datos
      const updatedRecord = await this.pb.collection('productsInventory').update(producto.id, updatedData);

      console.log(`Producto ${producto.name} actualizado correctamente con nueva cantidad: ${producto.unity}`);

      // Después de actualizar, volvemos a obtener la lista de productos actualizada
      this.updateProductsList();
    } catch (error) {
      console.error('Error al actualizar el producto:', error);
      throw new Error('Error al actualizar el producto');
    }
  }
}
