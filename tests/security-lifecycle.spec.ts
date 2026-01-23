import { test, expect } from "@playwright/test";

// Use admin state by default, but we'll override for specific steps
// This assumes 'auth.setup.ts' generated this file.
const adminStorageState = "playwright/.auth/user.json";

// Dynamic test user to avoid collisions if cleanup fails
const timestamp = Date.now();
const testUserEmail = `sec_${timestamp}@arknica.com`;
const testUserPass = "Password123!";
const testUserName = "Security Test User";

test.describe.serial("Security Lifecycle & Kill Switch", () => {
  // Use admin state for setup and teardown
  test.use({ storageState: adminStorageState });

  test("Paso 1: Creación de Usuario (Admin Context)", async ({ page }) => {
    console.log(`[TEST] Creating user: ${testUserEmail}`);
    await page.goto("/dashboard/team");

    // Open Dialog
    await page.getByRole("button", { name: "Nuevo Miembro" }).click();

    // Fill Form
    // Using generic selectors that likely match Shadcn/Radix UI structure
    await page.getByLabel("Nombre Completo").fill(testUserName);
    await page.getByLabel("Email Corporativo").fill(testUserEmail);

    // Select Role
    // Scope to the dialog
    const dialog = page.getByRole("dialog", {
      name: "Agregar Miembro del Equipo",
    });

    // Select Role
    await dialog
      .locator('div.grid:has(> label:has-text("Rol")) button[role="combobox"]')
      .click();
    await page.getByRole("option", { name: "Soporte Técnico" }).click();

    // Select Organization
    await dialog
      .locator(
        'div.grid:has(> label:has-text("Organización")) button[role="combobox"]',
      )
      .click();
    await page.getByRole("option").first().click();

    // Password
    await page.locator('input[name="password"]').fill(testUserPass);

    // Submit
    await page.getByRole("button", { name: "Crear Usuario" }).click();

    // Verify Success (Toast or UI update)
    // Wait for the dialog to close or the user to appear in the list using a more robust locator strategy
    await expect(page.getByText("Guardado")).toBeVisible();

    // Verify user is in the table
    // We reload or wait for revalidation
    await expect(page.getByText(testUserEmail)).toBeVisible();
  });

  test("Paso 2: Verificación de Acceso Inmediato (User Context)", async ({
    browser,
  }) => {
    console.log(`[TEST] Verifying access for: ${testUserEmail}`);

    // New context without admin storage state (Clean Session)
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto("/login");
    await page.getByLabel("Email").fill(testUserEmail);
    await page.getByLabel("Contraseña").fill(testUserPass);

    await page.getByRole("button", { name: "Ingresar" }).click();

    // ASSERT: Should redirect to dashboard immediately (No Email Confirm required)
    await page.waitForURL(/.*\/dashboard/);
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Check for a dashboard element
    await expect(
      page.getByRole("heading", { name: "Dashboard" }).first(),
    ).toBeVisible();

    await context.close();
  });

  test("Paso 3: Ejecución de Bloqueo (Admin Context)", async ({ page }) => {
    console.log(`[TEST] Blocking user: ${testUserEmail}`);
    await page.goto("/dashboard/team");

    // Locate the row securely
    const userRow = page.getByRole("row").filter({ hasText: testUserEmail });
    await expect(userRow).toBeVisible();

    // Click Edit (Assuming an 'Edit' button or icon exists in the row)
    // If it's inside a 'More' dropdown, we would need to click that first.
    // Based on previous code, likely a direct button or dropdown. Assuming standard UI.
    // Use fallback to 'Editar' text or icon if named button fails.
    if (await userRow.getByRole("button", { name: "Editar" }).isVisible()) {
      await userRow.getByRole("button", { name: "Editar" }).click();
    } else {
      // Try finding a generic button with pencil icon or similar if no text
      // For now, assume "Editar" text is accessible or aria-label
      await userRow.getByRole("button").first().click(); // Fallback to first button (often edit/actions)
      // If it opens a dropdown
      if (await page.getByRole("menuitem", { name: "Editar" }).isVisible()) {
        await page.getByRole("menuitem", { name: "Editar" }).click();
      }
    }

    // Toggle Block Switch
    // Look for a switch associated with 'Bloqueado' or 'Acceso'.
    // Shadcn switch usually has role 'switch'.
    await page.getByRole("switch", { name: /bloque|acceso/i }).click();

    // Save
    await page.getByRole("button", { name: "Guardar Cambios" }).click();

    // Verify
    await expect(page.getByText("Usuario actualizado")).toBeVisible();
  });

  test("Paso 4: Verificación de Kill Switch (User Context)", async ({
    browser,
  }) => {
    console.log(`[TEST] Verifying BLOCK for: ${testUserEmail}`);

    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto("/login");
    await page.getByLabel("Email").fill(testUserEmail);
    await page.getByLabel("Contraseña").fill(testUserPass);
    await page.getByRole("button", { name: "Ingresar" }).click();

    // ASSERT CRITICAL: Should NOT reach dashboard
    // The middleware should block access.
    // Expected behavior:
    // 1. Error on Login form ("Cuenta bloqueada") OR
    // 2. Redirect back to login with error param if middleware catches it post-login

    // We wait a bit to ensure no redirection to dashboard happens
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).not.toContain("/dashboard");
    expect(url).toContain("/login"); // Should stay or return to login

    // Optional: Check for specific error message if implementation provides one
    // await expect(page.getByText(/bloqueada|suspendida/i)).toBeVisible();

    await context.close();
  });

  test("Paso 5: Limpieza (Admin Context)", async ({ page }) => {
    console.log(`[TEST] Cleaning up user: ${testUserEmail}`);
    await page.goto("/dashboard/team");

    const userRow = page.getByRole("row").filter({ hasText: testUserEmail });

    // Delete
    // Logic depends on UI (Dropdown -> Delete or Direct Button)
    // Assuming similar to Edit
    if (await userRow.getByRole("button", { name: "Eliminar" }).isVisible()) {
      await userRow.getByRole("button", { name: "Eliminar" }).click();
    } else {
      // Open dropdown if needed
      await userRow.getByRole("button").first().click();
      await page.getByRole("menuitem", { name: "Eliminar" }).click();
    }

    // Confirm Dialog
    await page.getByRole("button", { name: "Eliminar" }).click(); // Confirm action in dialog

    // Verify gone
    await expect(page.getByText("Usuario eliminado")).toBeVisible();
    await expect(page.getByText(testUserEmail)).toBeHidden();
  });
});
