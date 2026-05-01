import {
  createClient,
  deleteClient,
  getClientById,
  getClients,
  updateClient,
} from "../services/clientService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createClientHandler = asyncHandler(async (req, res) => {
  const client = await createClient(req.body, req.user._id);
  res.status(201).json({ success: true, data: client });
});

export const listClientsHandler = asyncHandler(async (req, res) => {
  const clients = await getClients(req.query, req.user);
  res.json({ success: true, data: clients });
});

export const getClientHandler = asyncHandler(async (req, res) => {
  const client = await getClientById(req.params.id, req.user);
  res.json({ success: true, data: client });
});

export const updateClientHandler = asyncHandler(async (req, res) => {
  const client = await updateClient(req.params.id, req.body, req.user);
  res.json({ success: true, data: client });
});

export const deleteClientHandler = asyncHandler(async (req, res) => {
  await deleteClient(req.params.id, req.user);
  res.json({ success: true, message: "Client deleted successfully" });
});
