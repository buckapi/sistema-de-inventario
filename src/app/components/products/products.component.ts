import { Component } from '@angular/core';
import { GlobalService } from '../../services/global.service';
import { DataApiService } from '../../services/data-api.service';
import { AuthPocketbaseService } from '../../services/auth-pocketbase.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { RealtimeProductsService } from '../../services/realtime-productos.service';
import { RealtimeCategoriasService } from '../../services/realtime-categorias.service';
import { NewCategoryModalComponent } from '../new-category-modal/new-category-modal.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RealtimeVentasService } from '../../services/realtime-ventas.service';
import { UploadService } from '../../services/upload.service';
import { from } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,

  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {
  showForm = false;
  productForm: FormGroup;
  previewImage: string = 'assets/images/thumbs/setting-profile-img.jpg';
  products: any[] = []; // Changed Product to any[] since Product type is not defined
  products$: any;
  isEditing = false;
  currentProductId: string = '';
  showFilter = false;
  ventas: any[] = [];
  imagePreview: string | null = null; // Para mostrar la vista previa de la imagen
  selectedFile: File | null = null;
  selectedCategory: string = ''; // Default category
  searchQuery: string = ''; // Default search query
  productosFiltrados: any[] = [];
  productos$: any;
  searchTerm: string = '';

  constructor(
    public global: GlobalService,
    private fb: FormBuilder,
    public auth: AuthPocketbaseService,
    public realtimeProducts: RealtimeProductsService,
    public dataApiService: DataApiService,
    public realtimeCategorias: RealtimeCategoriasService,
    private dialog: MatDialog,
    public realtimeVentas: RealtimeVentasService,
    public uploadService: UploadService


  ) {
    this.realtimeProducts.products$;

    // Configurar el formulario con validadores
    this.productForm = this.fb.group({
      idCategoria: ['', Validators.required],
      name: ['', Validators.required],
      description: ['', Validators.required],
      unity: [1, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      code: [123, Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      file: [null]

    });
  }
  ngOnInit() {
    this.loadProducts();
    this.global.applyFilters(this.selectedCategory, this.searchQuery); // Initial call to set up default view
}
  loadProducts() {
    this.realtimeProducts.products$.subscribe((products: any[]) => {
      // Load products if needed
    });
  }
  onFilterChange() {
    this.global.applyFilters(this.selectedCategory, this.searchQuery);
  }
  
  
  openNewCategoryModal() {
    const dialogRef = this.dialog.open(NewCategoryModalComponent, {
      width: '600px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Actualizar las categorías si se agregó una nueva
        this.realtimeCategorias.categorias$;
      }
    });
  }
  showNewProduct() {
      this.showForm = !this.showForm;
      if (this.showForm) {
        this.isEditing = false;
        this.productForm.reset();
        this.previewImage = 'assets/images/thumbs/setting-profile-img.jpg';
        // Set default values if needed
        this.productForm.patchValue({
          unity: 1,
          price: 0,
          code: 123,
          stock: 0
        });
    }
  }

  addProduct() {
    if (this.productForm.valid) {
      const file = this.productForm.get('image')?.value;

      // First upload the image if it exists
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        this.dataApiService.uploadImage(file).subscribe({
          next: (fileResponse: any) => {
            // Create product with file reference
            const productData = {
              name: this.productForm.get('name')?.value,
              description: this.productForm.get('description')?.value,
              unity: parseInt(this.productForm.get('unity')?.value),
              price: parseFloat(this.productForm.get('price')?.value),
              code: parseInt(this.productForm.get('code')?.value),
              idCategoria: this.productForm.get('idCategoria')?.value,
              collection: 'productsInventory',
              file: fileResponse['file']
            };

            // Continue with product creation
            this.saveProduct(productData);
          },
          error: (error) => {
            console.error('Error uploading file:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error al subir la imagen. Por favor, intente nuevamente.'
            });
          }
        });
      } else {
        // If no image, create product without image reference
        const productData = {
          name: this.productForm.get('name')?.value,
          description: this.productForm.get('description')?.value,
          unity: parseInt(this.productForm.get('unity')?.value),
          price: parseFloat(this.productForm.get('price')?.value),
          code: parseInt(this.productForm.get('code')?.value),
          idCategoria: this.productForm.get('idCategoria')?.value,
          collection: 'productsInventory',
          stock: parseInt(this.productForm.get('stock')?.value),
          file: this.productForm.get('file')?.value
        };

        this.saveProduct(productData);
      }
    } else {
      console.log('Formulario inválido');
    }
  }

  async saveProduct(productData: any) {
    if (this.selectedFile) {
      try {
        const result = await this.uploadService.createProductRecord(
          this.selectedFile,
          productData
        );
        console.log('Record created successfully:', result);
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Producto guardado correctamente'
        });
        this.productForm.reset();
        this.showForm = false;
        this.realtimeProducts.products$ = from(this.uploadService.pb.collection('productsInventory').getFullList());
        this.selectedFile = null;
        this.imagePreview = null;
      } catch (error) {
        console.error('Error creating record:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el producto. Por favor, intente nuevamente.'
        });
      }
    } else {
      this.dataApiService.addProduct(productData).subscribe({
        next: (response) => {
          console.log('Respuesta exitosa:', response);
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Producto guardado correctamente'
          });
          this.productForm.reset();
          this.showForm = false;
          this.realtimeProducts.products$ = from(this.uploadService.pb.collection('productsInventory').getFullList());
        },
        error: (error) => {
          console.error('Error al guardar:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo guardar el producto. Por favor, intente nuevamente.'
          });
        }
      });
    }
  }

  updateProduct(productId: string) {
    this.currentProductId = productId;
    this.showForm = true;
    this.isEditing = true;

    // Obtener el producto actual y llenar el formulario
    this.realtimeProducts.products$.subscribe(products => {
      const product = products.find((p: any) => p.id === productId);
      if (product) {
        this.productForm.patchValue({
          name: product.name,
          code: product.code,
          description: product.description,
          unity: product.unity,
          price: product.price,
          idCategoria: product.idCategoria,
          file: product.file  
        });

        if (product.image) {
          this.imagePreview = product.image;
        }
      }
    });
  }
  async saveupdateProduct(productData: any) {
    try {
      // Crear un FormData para enviar el producto
      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('price', productData.price);
      formData.append('code', productData.code);
      formData.append('unity', productData.unity);
      formData.append('description', productData.description);
      formData.append('idCategoria', productData.idCategoria);
  
      // Si existe un archivo, lo agregamos al FormData
      if (productData.file) {
        formData.append('file', productData.file);
      }
  
      // Intentar actualizar el producto
      const record = await this.uploadService.pb.collection('productsInventory').update(this.currentProductId, formData);
  
      // Actualizar la lista de productos en tiempo real si es necesario
      // Esto podría ser necesario para mantener la vista sincronizada
      this.realtimeProducts.products$ = from(this.uploadService.pb.collection('productsInventory').getFullList());
 
      // Mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Producto actualizado correctamente'
      });
  
      // Actualizar los datos en el formulario para reflejar los cambios
      this.productForm.patchValue({
        name: productData.name,
        price: productData.price,
        code: productData.code,
        unity: productData.unity,
        description: productData.description,
        idCategoria: productData.idCategoria
      });
  
      // Cerrar el formulario de edición
      this.productForm.reset();
      this.showForm = false;
      this.isEditing = false;
  
    } catch (error) {
      console.error('Error al actualizar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el producto. Por favor, intente nuevamente.'
      });
    }
  }
  
  cancelEdit() {
    this.showForm = false;
    this.isEditing = false;
    this.productForm.reset();
    this.imagePreview = '';
  }
  deleteProduct(productId: string) {
    Swal.fire({
      title: '¿Está seguro?',
      text: "No podrá revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.dataApiService.deleteProduct(productId).subscribe({
          next: async (response) => {
            console.log('Producto eliminado exitosamente:', response);
            this.realtimeProducts.products$ = from(this.uploadService.pb.collection('productsInventory').getFullList());
            this.cancelEdit();
            Swal.fire(
              '¡Eliminado!',
              'El producto ha sido eliminado.',
              'success'
            );
          },
          error: (error) => {
            console.error('Error al eliminar:', error);
            Swal.fire(
              'Error',
              'No se pudo eliminar el producto.',
              'error'
            );
          }
        });
      }
    });
  }
  /* deleteProduct(productId: string) {
    Swal.fire({
      title: '¿Está seguro?',
      text: "No podrá revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.dataApiService.deleteProduct(productId).subscribe({
          next: (response) => {
            console.log('Producto eliminado exitosamente:', response);
            this.realtimeProducts.products$;
            this.cancelEdit();
            Swal.fire(
              '¡Eliminado!',
              'El producto ha sido eliminado.',
              'success'
            );
          },
          error: (error) => {
            console.error('Error al eliminar:', error);
            Swal.fire(
              'Error',
              'No se pudo eliminar el producto.',
              'error'
            );
          }
        });
      }
    });
  } */
  calculateStock(productId: string) {
    const product = this.products.find((p: any) => p.id === productId);
    if (product) {
      // Obtener el stock inicial del producto
      const initialStock = product.stock;
      
      // Calcular el total de unidades vendidas para este producto
      const totalSold = this.ventas
        .filter((ventas: any) => ventas.productId === productId)
        .reduce((total: number, ventas: any) => total + ventas.quantity, 0);
      
      // Retornar el stock actual (stock inicial - ventas totales)
      return initialStock - totalSold;
    }
    return 0;
  }

  onImageSelect(event: any) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result; // For preview
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

async uploadImageToServer(): Promise<{ url: string }> {
try {
  if (!this.selectedFile) {
    throw new Error('No image selected');
  }

  const formData = new FormData();
  formData.append('file', this.selectedFile);

  const response = await this.uploadService.pb.collection('files').create(formData);

  if (response && response['file']) {
    return { url: this.uploadService.pb.files.getUrl(response, response['file']) };
  } else {
    throw new Error('Failed to upload image');
  }
} catch (error) {
  console.error('Error uploading image:', error);
  throw error;
}
}

async uploadImageToServerCorrected(): Promise<{ url: string }> {
try {
  if (!this.selectedFile) {
    throw new Error('No image selected');
  }

  const formData = new FormData();
  formData.append('file', this.selectedFile);

  const response = await this.uploadService.pb.collection('files').create(formData);

  if (response && response['file']) {
    return { url: this.uploadService.pb.files.getUrl(response, response['file']) };
  } else {
    throw new Error('Failed to upload image');
  }
} catch (error) {
  console.error('Error uploading image:', error);
  throw error;
}
}
}
