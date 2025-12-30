import { z } from 'zod'

/*--------------- Server Environment Variables ---------------*/
const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.url('DATABASE_URL must be a valid URL').min(1, 'DATABASE_URL is required'),
})

/*--------------- Client Environment Variables ---------------*/
const clientEnvironmentSchema = z.object({
  // NEXT_PUBLIC_APP_NAME: z.string().min(1, 'NEXT_PUBLIC_APP_NAME is required'),
})

/*--------------- Parse Environment Variables ----------------*/
export const serverEnvironment = serverEnvironmentSchema.parse(process.env)
export const clientEnvironment = clientEnvironmentSchema.parse(process.env)

/*------------------- Combined Environment -------------------*/
const environment = {
  ...serverEnvironment,
  ...clientEnvironment,
}

export default environment
