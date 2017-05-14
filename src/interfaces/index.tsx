import { observable } from 'mobx'

interface SupplierData {
  id: number
  name: string
  street: string
  city: string
  country: string
  phone?: string
  email?: string
  website?: string
  description: string
  images: string[]
  services: Service[]
}

export class Supplier {
  id: number
  @observable name: Item
  @observable description: Item
  @observable address: Item
  @observable country: Item
  @observable phone?: Item
  @observable email?: Item
  @observable website?: Item
  images: string[]
  @observable services: Service[]

  constructor(data: SupplierData) {
    const address = `${data.street}, ${data.city}`
    this.id = data.id
    this.name = new Item(data.name)
    this.address = new Item(address)
    this.country = new Item(data.country)
    this.phone = new Item(data.phone)
    this.email = new Item(data.email)
    this.website = new Item(data.website)
    this.description = new Item(data.description)
    this.images = data.images
    this.services = data.services
  }
}

interface ServiceData {
  id: number
  name: string
  text: string
  supplierId: number
  image: string
}

export class Service {
  id: number
  supplierId: number
  @observable name: Item
  @observable text: Item
  image: string

  constructor(data: ServiceData) {
    this.id = data.id
    this.supplierId = data.supplierId
    this.name = new Item(data.name.toUpperCase())
    this.text = new Item(data.text)
    this.image = data.image
  }
}

export class Item {
  @observable content: string
  @observable editing: boolean = false

  constructor(content: string) {
    this.content = content
  }
}
