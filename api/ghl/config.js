/**
 * Shared GHL configuration and IDs for both locations
 */

// GHL location configuration
export const GHL_CONFIG = {
  ORLANDO: {
    locationId: 'ez4QcQYqIRKvgT8fIQ22',
    pipelineId: 'YrNc8hcJFysZAUEuZIvx',
    stages: {
      contactadoSet: new Set([
        'c7e4a8e1-fdbf-4702-a3b2-5f20883fd9c7', // 3. Contactado sin cita
        'e33fd18a-60b6-4254-b8b2-4a0de58f508a', // 4. Calificado sin cita
        '7c4796c8-5a17-4f34-8392-ef46bc83e497', // 5. Contactado faltan requisitos
        'd1bd15fd-4fe0-4002-8577-7611a445aed0', // 6. Interes futuro
        '2b345846-f786-41c4-b1dc-839b9d426739', // 7. Aplico ONLINE
        'aeadc726-b277-487c-bcd5-b6c1412c50e1', // 8. Cita agendada
        'e9c02162-f741-44b3-8a02-a85d9f489653', // 9. No-Show
        'bd32711e-376e-4808-95f0-898bdf2e77c8', // 10. Asistio NO APLICO
        '74ded8d7-4636-497d-8f0a-05451af5d028', // 11. Asistio NEGADO
        'eaf95326-e9e2-4648-ab03-03b000d295f1', // 12. Asistio APROBADO
        'cff39092-ffa1-4c4e-b9ee-84316819472e', // 13. VENDIDO
      ]),
      citaSet: new Set([
        'aeadc726-b277-487c-bcd5-b6c1412c50e1', // 8
        'e9c02162-f741-44b3-8a02-a85d9f489653', // 9
        'bd32711e-376e-4808-95f0-898bdf2e77c8', // 10
        '74ded8d7-4636-497d-8f0a-05451af5d028', // 11
        'eaf95326-e9e2-4648-ab03-03b000d295f1', // 12
        'cff39092-ffa1-4c4e-b9ee-84316819472e', // 13
      ]),
      showSet: new Set([
        'bd32711e-376e-4808-95f0-898bdf2e77c8', // 10
        '74ded8d7-4636-497d-8f0a-05451af5d028', // 11
        'eaf95326-e9e2-4648-ab03-03b000d295f1', // 12
        'cff39092-ffa1-4c4e-b9ee-84316819472e', // 13
      ]),
      aplicaronSet: new Set([
        '74ded8d7-4636-497d-8f0a-05451af5d028', // 11
        'eaf95326-e9e2-4648-ab03-03b000d295f1', // 12
        'cff39092-ffa1-4c4e-b9ee-84316819472e', // 13
      ]),
      aprobadosSet: new Set([
        'eaf95326-e9e2-4648-ab03-03b000d295f1', // 12
        'cff39092-ffa1-4c4e-b9ee-84316819472e', // 13
      ]),
      negado:  '74ded8d7-4636-497d-8f0a-05451af5d028', // 11
      vendido: 'cff39092-ffa1-4c4e-b9ee-84316819472e', // 13
    }
  },

  KISSIMMEE: {
    locationId: 'Vzt98VtJ6jqBE2dYYlnj',
    pipelineId: 'pj8Z0eoyQCz2WKIHFXAX',
    stages: {
      // Stage IDs verified against live GHL data (debug endpoint).
      // Confirmed working: 3,4,6,7,8,9,11,12,13.
      // Stages 1+2 (new/uncontacted leads) confirmed as:
      //   f364fd1b-84cc-4690-85f0-80a971af60af (all fresh leads land here)
      //   f0862719-0774-4d00-932b-9b9f336e693b
      //   → intentionally NOT in any set (not yet contacted)
      // da9fd58f and 55c3c255 are mid-pipeline stages added to contactadoSet.
      // If you see wrong counts, open GHL > Pipeline settings to verify stage names.
      contactadoSet: new Set([
        'a46ba5ea-a02d-40ac-bb25-fb8287251c21', // 3
        '3ced082b-773c-4567-ac1d-893e380815a3', // 4
        'e9a247a3-4a81-441a-b46e-4a4109479a47', // 5 (original ID, kept as fallback)
        'da9fd58f-53cf-4343-be9f-5a83ba7c1e33', // 5 alt (new ID seen in live data)
        '07d82839-5e39-4d7e-a041-47681b2322e0', // 6
        'dd6b5e02-6230-4d80-9517-cdd7135245d7', // 7
        'e66507c7-705e-4cc2-99cf-c63de4fd5475', // 8
        'bd520740-867b-42eb-b000-dfc8f9aefd0d', // 9
        'ce7102bf-3e91-42e3-9379-4762e5097abf', // 10 (original ID, kept as fallback)
        '55c3c255-ee3b-4c92-87eb-3d66fcf9ddba', // 10 alt (new ID seen in live data)
        'c19c3c61-4f70-4a0e-ac96-fe61efae7302', // 11
        '7eb00f52-3dc5-482d-b15f-5f15b611bb0d', // 12
        '9ece7230-eb28-4ffc-b7a7-5618497f3014', // 13
      ]),
      citaSet: new Set([
        'e66507c7-705e-4cc2-99cf-c63de4fd5475', // 8
        'bd520740-867b-42eb-b000-dfc8f9aefd0d', // 9
        'ce7102bf-3e91-42e3-9379-4762e5097abf', // 10
        '55c3c255-ee3b-4c92-87eb-3d66fcf9ddba', // 10 alt
        'c19c3c61-4f70-4a0e-ac96-fe61efae7302', // 11
        '7eb00f52-3dc5-482d-b15f-5f15b611bb0d', // 12
        '9ece7230-eb28-4ffc-b7a7-5618497f3014', // 13
      ]),
      showSet: new Set([
        'ce7102bf-3e91-42e3-9379-4762e5097abf', // 10
        '55c3c255-ee3b-4c92-87eb-3d66fcf9ddba', // 10 alt
        'c19c3c61-4f70-4a0e-ac96-fe61efae7302', // 11
        '7eb00f52-3dc5-482d-b15f-5f15b611bb0d', // 12
        '9ece7230-eb28-4ffc-b7a7-5618497f3014', // 13
      ]),
      aplicaronSet: new Set([
        'c19c3c61-4f70-4a0e-ac96-fe61efae7302', // 11
        '7eb00f52-3dc5-482d-b15f-5f15b611bb0d', // 12
        '9ece7230-eb28-4ffc-b7a7-5618497f3014', // 13
      ]),
      aprobadosSet: new Set([
        '7eb00f52-3dc5-482d-b15f-5f15b611bb0d', // 12
        '9ece7230-eb28-4ffc-b7a7-5618497f3014', // 13
      ]),
      negado:  'c19c3c61-4f70-4a0e-ac96-fe61efae7302', // 11
      vendido: '9ece7230-eb28-4ffc-b7a7-5618497f3014', // 13
    }
  }
};

// GHL user ID → Leaderboard name mapping
export const GHL_ID_TO_NAME = {
  // ORL Closers
  'Uv683v0pSIMCgPD91TOb': 'Fabiola Iorio',
  'y75JjO6sSjq0nL5Xw6JF': 'Laura Indriago',
  'QySpqRrxcWXr1YF0jyY3': 'María De Gouveia',
  'hc2or5bP7DIJiII9FrYY': 'Eleazar Hidalgo',
  // ORL Setters
  '77Y4ssGasg6QOKGepk0O': 'Juviany Padron',
  '80mizIxhQrpmXgsb93pm': 'Isiley Melendez',
  'zF40uhazM8W1XQCliZgN': 'David Mendoza',
  'wYzjY9PGxnY3xotGccZu': 'Katherine Atencio',
  'pPbNZKa58XGe8Fp8TMuw': 'Kener Ortega',
  'fUByWm6Q9MqYiL9PEl4M': 'Rene Pena',
  'QY6JjNR1GhVOO2PQnKfx': 'Nairelys Hernandez',
  '3QDNohrktHb6QdyEsOFK': 'Moises Gutierrez',
  // KSS Closers
  'LPtafFQB9QJg9t4YTw98': 'Christopher Cepeda',
  '2OIjTh9wVWhLegmwnoUT': 'Juan Rodriguez',
  'fKqeUgb4DHI8OjvOvi2Q': 'Nickol Montero',
  // KSS Setters
  'O1al7E9TYS0F2ZVw6J44': 'Elvis Pacheco',
  'EOyphwzRsH34S1EuSsMf': 'Carlos Bermudez',
  'a8uNp3jUWOQaBp2EIriU': 'Carlos Castillo',
  'tAqOv8IFbGEwZLqQz7ld': 'David Santos',
  'KYsFEsz8oshVr1foqcBr': 'Esther Alvarado',
  'pPJGWXEkNbg0knzU3MUz': 'Odimar Vasquez',
  'BEAgODgPXZDuMCNmz64B': 'Kevin Aranguren',
  'BBqxWi2sLytCrvkudz8k': 'Katherine Jimenez',
  'CCFn3tgplyrM4Dfd3yDL': 'Keila Ojeda',
  'g2geHQkwvHDktBxLN9sa': 'Jazmin Tua',
  'Dxu8wMcO0vJfiKQ0Viqj': 'Gabriel Zambrano',
};

// GHL API base URL
export const GHL_API_BASE = 'https://services.leadconnectorhq.com';

// GHL API version
export const GHL_API_VERSION = '2021-07-28';
