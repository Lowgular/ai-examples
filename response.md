```typescript
export interface ProductModel {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly category: string;
  readonly stockQuantity: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```