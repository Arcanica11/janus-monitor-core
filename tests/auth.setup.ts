import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  console.log("--> Iniciando autenticación QA...");

  // 1. Ir al login
  await page.goto("/login");

  // 2. Llenar credenciales (Usando Labels, no placeholders)
  await page.getByLabel("Email").fill("ceo@arknica.com");
  await page.getByLabel("Contraseña").fill("Arknica2026*");

  // 3. Click en Ingresar
  await page.getByRole("button", { name: "Ingresar" }).click();

  // 4. Esperar navegación exitosa
  // Esperamos a que la URL ya no sea /login
  await page.waitForURL(/.*\/dashboard/);

  // Verificación extra visual
  // await expect(page.getByText('Bienvenido', { exact: false })).toBeHidden();

  // 5. Guardar estado
  await page.context().storageState({ path: authFile });
  console.log("--> Autenticación exitosa. Estado guardado.");
});
