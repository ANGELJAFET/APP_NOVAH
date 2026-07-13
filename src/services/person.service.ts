import { PoolConnection, RowDataPacket } from "mysql2/promise";
import { pool } from "../config/db";
import { AppError } from "../utils/AppError";
import { PersonCreateDTO, PersonListQueryDTO, PersonUpdateDTO } from "../validators/person.validator";
import { CredentialInput, EducationalCredential, PaginatedResult, Person, PersonWithCredentials } from "../types";

interface PersonRow extends RowDataPacket {
  id: number;
  nit: string;
  name: string;
  address: string;
  phone_number: string;
}

interface CredentialRow extends RowDataPacket {
  id: number;
  person_id: number;
  type: EducationalCredential["type"];
  organization: string;
  acquired_credential: string;
  year: number;
}

function mapPerson(row: PersonRow): Person {
  return {
    id: row.id,
    nit: row.nit,
    name: row.name,
    address: row.address,
    phoneNumber: row.phone_number,
  };
}

function mapCredential(row: CredentialRow): EducationalCredential {
  return {
    id: row.id,
    personId: row.person_id,
    type: row.type,
    organization: row.organization,
    acquiredCredential: row.acquired_credential,
    year: row.year,
  };
}

async function insertCredentials(
  conn: PoolConnection,
  personId: number,
  credentials: CredentialInput[]
): Promise<void> {
  for (const credential of credentials) {
    await conn.query("CALL sp_credential_insert(?, ?, ?, ?, ?)", [
      personId,
      credential.type,
      credential.organization,
      credential.acquiredCredential,
      credential.year,
    ]);
  }
}

async function fetchPersonWithCredentials(
  conn: PoolConnection,
  personId: number
): Promise<PersonWithCredentials> {
  const [results] = await conn.query<[PersonRow[], CredentialRow[]]>(
    "CALL sp_person_get_by_id(?)",
    [personId]
  );
  const [personRows, credentialRows] = results;
  if (personRows.length === 0) {
    throw new AppError(404, "PERSON_NOT_FOUND", "La persona no existe.");
  }
  return {
    ...mapPerson(personRows[0]),
    credentials: credentialRows.map(mapCredential),
  };
}

export async function listPersons(
  query: PersonListQueryDTO
): Promise<PaginatedResult<Person>> {
  const conn = await pool.getConnection();
  try {
    const [results] = await conn.query<[PersonRow[]]>(
      "CALL sp_person_list(?, ?, ?, ?, ?, @total)",
      [query.name ?? null, query.page, query.pageSize, query.sortBy, query.sortDir]
    );
    const [[{ total }]] = await conn.query<RowDataPacket[]>("SELECT @total AS total");
    const personRows = results[0];
    return {
      data: personRows.map(mapPerson),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  } finally {
    conn.release();
  }
}

export async function getPersonById(id: number): Promise<PersonWithCredentials> {
  const conn = await pool.getConnection();
  try {
    return await fetchPersonWithCredentials(conn, id);
  } finally {
    conn.release();
  }
}

export async function createPerson(input: PersonCreateDTO): Promise<PersonWithCredentials> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [results] = await conn.query<[PersonRow[]]>("CALL sp_person_insert(?, ?, ?, ?)", [
      input.nit,
      input.name,
      input.address,
      input.phoneNumber,
    ]);
    const personRow = results[0][0];
    await insertCredentials(conn, personRow.id, input.credentials);
    await conn.commit();
    return await fetchPersonWithCredentials(conn, personRow.id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function updatePerson(
  id: number,
  input: PersonUpdateDTO
): Promise<PersonWithCredentials> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("CALL sp_person_update(?, ?, ?, ?)", [
      id,
      input.name,
      input.address,
      input.phoneNumber,
    ]);
    await conn.query("CALL sp_credentials_delete_by_person(?)", [id]);
    await insertCredentials(conn, id, input.credentials);
    await conn.commit();
    return await fetchPersonWithCredentials(conn, id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function deletePerson(id: number): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.query("CALL sp_person_delete(?)", [id]);
  } finally {
    conn.release();
  }
}
