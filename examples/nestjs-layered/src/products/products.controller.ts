import { Controller, Get, Post, Body, Param, HttpException } from '@nestjs/common'

const products: any[] = []

@Controller('products')
export class ProductsController {
  @Post()
  createProduct(@Body() body: any) {
    if (!body.name || !body.price) {
      throw new HttpException('Name and price required', 400)
    }

    const product = {
      id: products.length + 1,
      name: body.name,
      price: body.price,
      createdAt: new Date(),
    }

    products.push(product)
    return product
  }

  @Get()
  findAll() {
    return products
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const product = products.find(p => p.id === parseInt(id))
    if (!product) {
      throw new HttpException('Product not found', 404)
    }
    return product
  }
}
