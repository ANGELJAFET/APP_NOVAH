import { z } from "zod";

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s]+$/;
const NIT_REGEX = /^[A-Za-z0-9-]{1,10}$/;
const PHONE_REGEX = /^[0-9+\-()\s]{1,16}$/;

export const credentialSchema = z.object({
  type: z.enum(["GED", "BACHELORS", "MASTERS", "PHD", "CERTIFICATION"], {
    message: "El tipo de credencial no es válido.",
  }),
  organization: z.string().trim().min(1, "La organización es requerida.").max(60),
  acquiredCredential: z.string().trim().min(1, "El título obtenido es requerido.").max(100),
  year: z.coerce.number().int().min(1900).max(2100),
});

export const personCreateSchema = z.object({
  nit: z.string().trim().regex(NIT_REGEX, "El NIT no es válido.").max(10),
  name: z
    .string()
    .trim()
    .min(1, "El nombre es requerido.")
    .max(60)
    .regex(NAME_REGEX, "El nombre solo puede contener letras del alfabeto español."),
  address: z.string().trim().min(1, "La dirección es requerida.").max(100),
  phoneNumber: z.string().trim().regex(PHONE_REGEX, "El número de teléfono no es válido.").max(16),
  credentials: z.array(credentialSchema).min(1, "Debe existir al menos un registro de detalle."),
});

export const personUpdateSchema = z.object({
  name: personCreateSchema.shape.name,
  address: personCreateSchema.shape.address,
  phoneNumber: personCreateSchema.shape.phoneNumber,
  credentials: personCreateSchema.shape.credentials,
});

export const personListQuerySchema = z.object({
  name: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(5),
  sortBy: z.enum(["id", "name"]).default("id"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

export type PersonCreateDTO = z.infer<typeof personCreateSchema>;
export type PersonUpdateDTO = z.infer<typeof personUpdateSchema>;
export type PersonListQueryDTO = z.infer<typeof personListQuerySchema>;
