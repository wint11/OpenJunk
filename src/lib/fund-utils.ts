
/**
 * Generates a serial number for a fund application.
 * Format: {YEAR}-{DEPTCODE}-{TIMESTAMP}{RANDOM}
 * Example: 2026-CS-123456789
 * 
 * @param year The year of the fund
 * @param deptCode The code of the department (default: "0")
 * @returns Generated serial number string
 */
export function generateFundSerialNo(year: number | string, deptCode: string = "0"): string {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${year}-${deptCode}-${timestamp}${random}`
}
