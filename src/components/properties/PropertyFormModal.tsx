import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { useUi } from '../../context/UiContext'
import type { PropertyInput } from '../../types'
import { PROPERTY_STATUSES, PROPERTY_TYPES } from '../../types'
import { PROPERTY_STATUS_LABEL, PROPERTY_TYPE_LABEL } from '../../utils/labels'
import { propertyImageDataUri } from '../../utils/propertyVisual'
import { propertyFormSchema, type PropertyFormValues } from '../../utils/schemas'
import { Button } from '../ui/Button'
import { controlClass, Field } from '../ui/Field'
import { Modal } from '../ui/Modal'

const blank = (): PropertyFormValues => ({
  title: '',
  propertyType: 'apartment',
  location: '',
  price: '',
  bedrooms: '2',
  bathrooms: '2',
  areaSqFt: '',
  status: 'available',
  description: '',
  imageUrl: '',
})

export function PropertyFormModal() {
  const { propertyForm, closePropertyForm } = useUi()
  const { state, addProperty, updateProperty } = useApp()
  const toast = useToast()
  const open = propertyForm !== null
  const editing = state.properties.find((property) => property.id === propertyForm?.propertyId)

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: blank(),
  })

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.reset({
        title: editing.title,
        propertyType: editing.propertyType,
        location: editing.location,
        price: String(editing.price),
        bedrooms: String(editing.bedrooms),
        bathrooms: String(editing.bathrooms),
        areaSqFt: String(editing.areaSqFt),
        status: editing.status,
        description: editing.description,
        imageUrl: editing.imageUrl.startsWith('data:') ? '' : editing.imageUrl,
      })
      return
    }
    form.reset(blank())
  }, [open, propertyForm?.propertyId])

  function onSubmit(values: PropertyFormValues) {
    const id = editing?.id ?? 'preview'
    const input: PropertyInput = {
      title: values.title,
      propertyType: values.propertyType,
      location: values.location,
      price: Number(values.price),
      bedrooms: Number(values.bedrooms),
      bathrooms: Number(values.bathrooms),
      areaSqFt: Number(values.areaSqFt),
      status: values.status,
      description: values.description,
      imageUrl: values.imageUrl.trim() || propertyImageDataUri(id, values.propertyType, values.title),
    }
    if (editing) {
      updateProperty(editing.id, input)
      toast.success('Property updated')
    } else {
      addProperty({
        ...input,
        imageUrl: values.imageUrl.trim() || propertyImageDataUri(`prop_${values.title}`, values.propertyType, values.title),
      })
      toast.success('Property added')
    }
    closePropertyForm()
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit property' : 'Add property'}
      description="Prices are stored in INR. Leave the image blank to use a local preview."
      onClose={closePropertyForm}
      size="lg"
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Field label="Title" htmlFor="prop-title" required error={form.formState.errors.title?.message} className="sm:col-span-2">
          <input id="prop-title" data-autofocus className={controlClass} {...form.register('title')} />
        </Field>
        <Field label="Type" htmlFor="prop-type" required>
          <select id="prop-type" className={controlClass} {...form.register('propertyType')}>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {PROPERTY_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status" htmlFor="prop-status" required>
          <select id="prop-status" className={controlClass} {...form.register('status')}>
            {PROPERTY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PROPERTY_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Location" htmlFor="prop-location" required error={form.formState.errors.location?.message} className="sm:col-span-2">
          <input id="prop-location" className={controlClass} {...form.register('location')} />
        </Field>
        <Field label="Price (INR)" htmlFor="prop-price" required error={form.formState.errors.price?.message}>
          <input id="prop-price" inputMode="numeric" className={controlClass} {...form.register('price')} />
        </Field>
        <Field label="Area (sq ft)" htmlFor="prop-area" required error={form.formState.errors.areaSqFt?.message}>
          <input id="prop-area" inputMode="numeric" className={controlClass} {...form.register('areaSqFt')} />
        </Field>
        <Field label="Bedrooms" htmlFor="prop-beds" required error={form.formState.errors.bedrooms?.message}>
          <input id="prop-beds" inputMode="numeric" className={controlClass} {...form.register('bedrooms')} />
        </Field>
        <Field label="Bathrooms" htmlFor="prop-baths" required error={form.formState.errors.bathrooms?.message}>
          <input id="prop-baths" inputMode="numeric" className={controlClass} {...form.register('bathrooms')} />
        </Field>
        <Field label="Image URL" htmlFor="prop-image" className="sm:col-span-2" hint="Optional. A designed preview is used when this is empty or fails to load.">
          <input id="prop-image" className={controlClass} placeholder="Leave blank for a generated preview" {...form.register('imageUrl')} />
        </Field>
        <Field label="Description" htmlFor="prop-description" required error={form.formState.errors.description?.message} className="sm:col-span-2">
          <textarea id="prop-description" rows={3} className={controlClass} {...form.register('description')} />
        </Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button variant="secondary" onClick={closePropertyForm}>
            Cancel
          </Button>
          <Button type="submit">{editing ? 'Save property' : 'Add property'}</Button>
        </div>
      </form>
    </Modal>
  )
}
