import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import {
  personCreateSchema,
  personListQuerySchema,
  personUpdateSchema,
} from "../validators/person.validator";
import * as personService from "../services/person.service";

function parseId(rawId: string | string[]): number {
  const id = Number(Array.isArray(rawId) ? rawId[0] : rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "INVALID_ID", "El id debe ser un número entero positivo.");
  }
  return id;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = personListQuerySchema.parse(req.query);
    const result = await personService.listPersons(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseId(req.params.id);
    const person = await personService.getPersonById(id);
    res.json(person);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = personCreateSchema.parse(req.body);
    const person = await personService.createPerson(input);
    res.status(201).json(person);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseId(req.params.id);
    const input = personUpdateSchema.parse(req.body);
    const person = await personService.updatePerson(id, input);
    res.json(person);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseId(req.params.id);
    await personService.deletePerson(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
