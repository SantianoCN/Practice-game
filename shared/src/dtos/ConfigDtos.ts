import { z } from 'zod';
import * as schemas from '../schemas/ConfigSchemas';

export type EntityStatsDTO = z.infer<typeof schemas.EntityStatsSchema>;
export type ProjectileConfigDTO = z.infer<typeof schemas.ProjectileConfigSchema>;
export type WeaponConfigDTO = z.infer<typeof schemas.WeaponConfigSchema>;
export type StartingWeaponPresetDTO = z.infer<typeof schemas.StartingWeaponPresetSchema>;
export type PlayerClassPresetDTO = z.infer<typeof schemas.PlayerClassPresetSchema>;