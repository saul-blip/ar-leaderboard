/**
 * ONE-TIME SCRIPT: Populate historical month tabs in the clean AR Leaderboard Data sheet.
 * Paste this into the Apps Script editor and run populateHistory().
 */

const TARGET_SHEET_ID = '16LaMfxt2SLhYyBTKpHOthvxupr-fT2v5TiOBbtDaUls';

function populateHistory() {
  const ss = SpreadsheetApp.openById(TARGET_SHEET_ID);

  // ===== SETTERS =====

  createTab(ss, 'Setters_2025-09',
    ['Nombre','PIN','Foto','LeadsAsignados','Contactados','CitasAgendadas','Shows','Ventas','Aplicaron','Aprobados','Negados','UltimaActividad'],
    [
      ['Christian Montañez','2100','',156,156,54,27,7,17,8,9,''],
      ['Moises Gutierrez','2001','',156,156,33,26,7,23,8,15,''],
      ['Juviany Padron','2002','',187,187,33,45,8,26,14,12,''],
      ['Isiley Melendez','2003','',282,282,81,32,8,26,13,13,''],
      ['Ludwig Piñero','2101','',98,98,55,15,4,15,8,7,''],
      ['Victor Marques','2102','',138,138,54,23,7,24,0,24,''],
      ['Fabiola Perez','2103','',51,51,18,4,0,0,0,0,''],
      ['Mayrin Pereira','2104','',0,0,0,0,0,0,0,0,''],
      ['Gabriela Morán','2105','',7,7,2,0,0,0,0,0,''],
      ['Elvis Pacheco','2005','',155,155,59,22,4,9,4,5,''],
      ['Jose Gonzalez','2106','',0,0,0,0,0,0,0,0,''],
      ['Valentina Bachour','2107','',67,67,7,1,0,3,0,0,''],
      ['Gabriela Pirronghellys','2108','',12,12,1,0,0,0,0,0,''],
      ['Jose Sayago','2109','',28,28,2,0,0,0,0,0,''],
      ['Olga Rodriguez','2110','',22,22,7,0,0,0,0,0,''],
      ['Abel graterol','2111','',7,7,2,0,0,0,0,0,''],
    ]);

  createTab(ss, 'Setters_2025-10',
    ['Nombre','PIN','Foto','LeadsAsignados','Contactados','CitasAgendadas','Shows','Ventas','Aplicaron','Aprobados','Negados','UltimaActividad'],
    [
      ['Christian Montañez','2112','',171,171,38,19,3,12,4,8,''],
      ['Moises Gutierrez','2001','',223,223,47,40,8,30,14,16,''],
      ['Juviany Padron','2002','',221,221,29,26,6,17,10,7,''],
      ['Isiley Melendez','2003','',292,292,70,36,6,33,9,24,''],
      ['Ludwig Piñero','2113','',80,80,42,7,1,7,2,5,''],
      ['Victor Marques','2114','',144,144,41,14,1,12,0,12,''],
      ['Elvis Pacheco','2005','',232,232,85,39,4,20,4,16,''],
      ['Valentina Pirronghellys','2115','',86,86,23,4,1,3,1,2,''],
      ['Rene Peña','2004','',131,131,63,14,2,10,2,8,''],
      ['Nelson Linares','2116','',61,61,3,1,0,0,0,0,''],
      ['Ana Polaco','2117','',34,34,0,0,0,0,0,0,''],
      ['Anthony Patiño','2012','',50,50,16,4,0,3,0,3,''],
      ['Arquimides Lopez','2118','',35,35,4,0,0,0,0,0,''],
      ['Angela Zambrano','2119','',22,22,3,0,0,0,0,0,''],
      ['Emily Vazquez','2120','',21,21,4,0,0,0,0,0,''],
      ['Luisany chacon','2121','',8,8,1,0,0,0,0,0,''],
    ]);

  createTab(ss, 'Setters_2025-11',
    ['Nombre','PIN','Foto','LeadsAsignados','Contactados','CitasAgendadas','Shows','Ventas','Aplicaron','Aprobados','Negados','UltimaActividad'],
    [
      ['Christian Montañez','2122','',52,52,13,6,3,3,2,1,''],
      ['Moises Gutierrez','2001','',130,130,27,22,4,16,8,8,''],
      ['Juviany Padron','2002','',169,169,31,26,5,16,7,9,''],
      ['Isiley Melendez','2003','',246,246,57,33,5,33,10,23,''],
      ['Victor Marques','2123','',123,123,30,13,3,16,1,15,''],
      ['Elvis Pacheco','2005','',255,255,58,23,2,15,3,12,''],
      ['Rene Peña','2004','',170,170,51,17,2,12,2,10,''],
      ['Anthony Patiño','2012','',111,111,34,13,1,9,3,6,''],
      ['Emily Vazquez','2124','',27,27,4,1,0,0,0,0,''],
      ['Gerardo parra','2125','',9,9,0,1,0,0,0,0,''],
      ['Diosa Castillo','2126','',1,1,0,0,0,0,0,0,''],
      ['Elias Torrealba','2127','',13,13,1,1,0,0,0,0,''],
      ['Jonathan Morales','2128','',9,9,0,0,0,0,0,0,''],
      ['Cesar Monrroy','2129','',1,1,0,0,0,0,0,0,''],
      ['David mendoza','2007','',17,17,2,1,0,0,0,0,''],
      ['Mishelle Asfour','2130','',1,1,0,0,0,0,0,0,''],
      ['Odimar Vasquez','2008','',13,13,1,1,1,1,1,0,''],
      ['Maria gonzalez','2131','',9,9,0,0,0,0,0,0,''],
    ]);

  createTab(ss, 'Setters_2025-12',
    ['Nombre','PIN','Foto','LeadsAsignados','Contactados','CitasAgendadas','Shows','Ventas','Aplicaron','Aprobados','Negados','UltimaActividad'],
    [
      ['Moises Gutierrez','2001','',108,108,19,15,5,15,7,8,''],
      ['Juviany Padron','2002','',167,167,50,29,2,15,7,8,''],
      ['Isiley Melendez','2003','',251,251,47,23,7,19,10,9,''],
      ['Victor Marques','2132','',72,72,3,3,2,5,2,3,''],
      ['Elvis Pacheco','2005','',204,204,69,23,5,14,8,6,''],
      ['Rene Peña','2004','',148,148,43,20,0,11,0,11,''],
      ['Anthony Patiño','2012','',82,82,27,10,4,7,4,3,''],
      ['David mendoza','2007','',78,78,29,12,3,1,0,1,''],
      ['Maria gonzalez','2133','',23,23,6,1,0,0,0,0,''],
      ['Jacobo Urdaneta','2134','',46,46,7,0,0,0,0,0,''],
      ['Jirmen Ynojosa','2135','',3,3,2,0,0,0,0,0,''],
      ['David Santos','2009','',61,61,24,3,1,2,1,1,''],
      ['Carlos Bermudez','2013','',0,0,0,0,0,0,0,0,''],
    ]);

  createTab(ss, 'Setters_2026-01',
    ['Nombre','PIN','Foto','LeadsAsignados','Contactados','CitasAgendadas','Shows','Ventas','Aplicaron','Aprobados','Negados','UltimaActividad'],
    [
      ['Moises Gutierrez','2001','',158,158,32,27,3,21,7,14,''],
      ['Juviany Padron','2002','',188,188,60,28,3,16,5,11,''],
      ['Isiley Melendez','2003','',207,207,57,26,4,19,9,10,''],
      ['Elvis Pacheco','2005','',243,243,52,18,5,16,6,10,''],
      ['Rene Peña','2004','',170,170,41,12,1,16,2,14,''],
      ['Anthony Patiño','2012','',43,43,28,7,0,6,4,2,''],
      ['David mendoza','2007','',123,123,36,12,3,8,0,8,''],
      ['David Santos','2009','',93,93,28,8,1,2,1,1,''],
      ['Carlos Bermudez','2013','',123,123,41,12,1,5,2,3,''],
      ['Ronny Lopez','2136','',66,66,5,0,0,0,0,0,''],
      ['Katherine Atencio','2006','',70,70,23,10,2,6,2,4,''],
      ['Mickey Gonzalez','2137','',1,1,0,0,0,0,0,0,''],
      ['Kener Ortega','2010','',15,15,3,0,0,0,0,0,''],
    ]);

  // ===== CLOSERS (now with Cancelaciones column) =====

  createTab(ss, 'Closers_2025-09',
    ['Nombre','PIN','Foto','SelfGen','CallCenter','Sits','CitasPropias','VisitasPropias','Aplicaron','Aprobados','Negados','Cancelaciones','UltimaActividad'],
    [
      ['Carlos Castillo','1100','',0,10,29,31,26,29,16,13,2,''],
      ['Fabiola Iorio','1001','',0,9,19,40,27,19,10,9,0,''],
      ['Laura Indriago','1002','',0,10,36,37,41,36,11,25,2,''],
      ['Juan Rodriguez','1004','',0,7,9,14,12,9,9,0,2,''],
      ['Nickol Montero','1101','',0,7,26,20,23,26,10,16,1,''],
      ['Anahi Hernandez','1102','',0,5,22,44,31,22,5,17,1,''],
      ['Kevin Giralt','1103','',0,1,2,2,2,2,1,1,0,''],
      ['Jose Hernandez','1104','',0,8,10,20,13,10,9,1,1,''],
      ['Juan Montero','1105','',0,2,14,0,21,14,9,5,5,''],
      ['Erlych Tory','1106','',0,2,2,3,2,2,2,0,1,''],
      ['Daniel Sanchez','1107','',0,0,0,0,0,0,0,0,0,''],
      ['Christopher Cepeda','1003','',0,1,2,8,2,2,2,0,1,''],
      ['Bryan Suarez','1108','',0,0,0,0,0,0,0,0,0,''],
    ]);

  // No Closers_2025-10 (tab doesn't exist in manual sheet)

  createTab(ss, 'Closers_2025-11',
    ['Nombre','PIN','Foto','SelfGen','CallCenter','Sits','CitasPropias','VisitasPropias','Aplicaron','Aprobados','Negados','Cancelaciones','UltimaActividad'],
    [
      ['Carlos Castillo','1109','',0,10,29,20,38,29,14,15,4,''],
      ['Fabiola Iorio','1001','',0,6,33,32,42,33,10,23,2,''],
      ['Laura Indriago','1002','',0,8,30,22,45,30,11,20,1,''],
      ['Juan Rodriguez','1004','',1,6,20,25,25,20,8,12,2,''],
      ['Nickol Montero','1110','',0,2,25,34,35,25,7,18,1,''],
      ['Anahi Hernandez','1111','',0,5,26,30,37,26,8,18,0,''],
      ['Jose Hernandez','1112','',0,7,21,14,27,21,9,12,2,''],
      ['Erlych Tory','1113','',0,1,2,1,4,2,1,1,0,''],
      ['Christopher Cepeda','1003','',0,6,21,25,21,21,9,12,1,''],
      ['Bryan Suarez','1114','',0,3,12,16,11,12,4,8,0,''],
      ['Marileyshka Perez','1115','',0,2,9,12,9,9,2,7,0,''],
    ]);

  createTab(ss, 'Closers_2025-12',
    ['Nombre','PIN','Foto','SelfGen','CallCenter','Sits','CitasPropias','VisitasPropias','Aplicaron','Aprobados','Negados','Cancelaciones','UltimaActividad'],
    [
      ['Fabiola Iorio','1001','',0,13,28,44,40,28,20,8,1,''],
      ['Laura Indriago','1002','',5,8,33,47,47,33,13,20,0,''],
      ['Juan Rodriguez','1004','',0,9,26,21,28,26,17,9,0,''],
      ['Nickol Montero','1116','',0,7,21,33,28,21,10,11,0,''],
      ['Anahi Hernandez','1117','',0,10,29,30,37,29,10,19,0,''],
      ['Jose Hernandez','1118','',0,6,22,25,26,22,8,14,0,''],
      ['Christopher Cepeda','1003','',0,10,35,44,38,35,20,15,0,''],
      ['Fady Zahr Chacón','1119','',0,5,17,23,20,17,9,8,0,''],
      ['Alexander Granadino','1120','',0,0,3,10,6,3,2,1,1,''],
      ['Jhonatan Galeano Ospina','1121','',0,0,0,0,0,0,0,0,0,''],
      ['María De Gouveia','1122','',0,3,24,33,26,24,9,15,0,''],
      ['Christopher Colon','1123','',0,0,0,0,0,0,0,0,0,''],
      ['Santiago Tapia','1124','',0,0,0,1,0,0,0,0,0,''],
      ['Jaily Prieto','1125','',0,0,0,3,1,0,0,0,0,''],
    ]);

  createTab(ss, 'Closers_2026-01',
    ['Nombre','PIN','Foto','SelfGen','CallCenter','Sits','CitasPropias','VisitasPropias','Aplicaron','Aprobados','Negados','Cancelaciones','UltimaActividad'],
    [
      ['Fabiola Iorio','1001','',0,4,39,36,39,39,6,33,0,''],
      ['Laura Indriago','1002','',2,6,42,39,61,42,11,31,1,''],
      ['Juan Rodriguez','1004','',0,3,10,8,14,10,5,5,0,''],
      ['Nickol Montero','1126','',0,1,14,24,21,14,2,0,0,''],
      ['Anahi Hernandez','1127','',0,4,14,20,19,14,6,8,0,''],
      ['Jose Hernandez','1128','',0,4,14,14,18,14,3,11,1,''],
      ['Christopher Cepeda','1003','',0,8,37,48,41,37,23,14,0,''],
      ['Fady Zahr Chacón','1129','',0,3,23,27,25,23,6,17,0,''],
      ['Alexander Granadino','1130','',0,0,0,0,0,0,0,0,0,''],
      ['Jhonatan Galeano Ospina','1131','',0,0,0,0,0,0,0,0,0,''],
      ['María De Gouveia','1132','',0,4,33,34,39,33,5,28,0,''],
      ['Luis Parra','1133','',0,1,3,3,3,3,1,2,0,''],
      ['Fernando','1134','',0,0,0,2,0,0,0,0,0,''],
      ['Luis De Leon','1135','',0,1,0,12,2,0,0,0,0,''],
      ['Gabriel D Vargas','1136','',0,1,0,5,0,0,0,0,0,''],
      ['Giovanni Martinez','1009','',0,1,0,3,0,0,0,0,0,''],
      ['Pablo Rivera','1137','',0,0,0,1,0,0,0,0,0,''],
      ['Joel Nieves','1138','',0,0,0,3,0,0,0,0,0,''],
    ]);

  // ===== UPDATE CURRENT MONTH: Add Cancelaciones column to Closers_2026-02 =====
  addCancelacionesColumn(ss, 'Closers_2026-02', {
    'Juan Rodriguez': 1,
    'Maria De Gouveia': 1,
    'María De Gouveia': 1,
  });

  Logger.log('All historical tabs created successfully!');
}

function addCancelacionesColumn(ss, tabName, cancelData) {
  const sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    Logger.log('Tab not found: ' + tabName);
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Check if Cancelaciones column already exists
  const cancelIdx = headers.indexOf('Cancelaciones');
  if (cancelIdx >= 0) {
    Logger.log('Cancelaciones column already exists in ' + tabName);
    return;
  }

  // Insert Cancelaciones before UltimaActividad
  const uaIdx = headers.indexOf('UltimaActividad');
  const insertCol = uaIdx >= 0 ? uaIdx + 1 : headers.length + 1; // 1-based

  sheet.insertColumnBefore(insertCol);
  sheet.getRange(1, insertCol).setValue('Cancelaciones');

  // Fill cancel values
  const nameIdx = headers.indexOf('Nombre');
  for (let r = 1; r < data.length; r++) {
    const name = data[r][nameIdx];
    const cancels = cancelData[name] || 0;
    sheet.getRange(r + 1, insertCol).setValue(cancels);
  }

  Logger.log('Added Cancelaciones column to ' + tabName);
}

function createTab(ss, tabName, headers, data) {
  let sheet = ss.getSheetByName(tabName);
  if (sheet) {
    sheet.clear();
    Logger.log('Cleared existing tab: ' + tabName);
  } else {
    sheet = ss.insertSheet(tabName);
    Logger.log('Created new tab: ' + tabName);
  }

  const allRows = [headers, ...data];
  sheet.getRange(1, 1, allRows.length, headers.length).setValues(allRows);
}
