export interface EntityRule {
  match: string[];
  network: string;
  candidate: string;
  enforcement: string;
  legalBasis: string;
}

/** Reglas de correspondencia entre la clasificación de red vial registrada y la entidad candidata. */
export const entityRules: EntityRule[] = [
{ match: ['NACIONAL'], network: 'Red vial nacional', candidate: 'Provías Nacional – MTC', enforcement: 'SUTRAN y Policía Nacional del Perú', legalBasis: 'Reglamento Nacional de Gestión de Infraestructura Vial (D.S. 034-2008-MTC)' },
{ match: ['DEPARTAMENTAL', 'REGIONAL'], network: 'Red vial departamental', candidate: 'Gobierno Regional de Arequipa', enforcement: 'Policía Nacional del Perú', legalBasis: 'D.S. 034-2008-MTC; Ley 27867, Orgánica de Gobiernos Regionales' },
{ match: ['VECINAL', 'RURAL'], network: 'Red vial vecinal o rural', candidate: 'Municipalidad provincial correspondiente', enforcement: 'Municipalidad y Policía Nacional del Perú', legalBasis: 'D.S. 034-2008-MTC; Ley 27972, Orgánica de Municipalidades' },
{ match: ['URBANA', 'URBANO', 'CALLE', 'AVENIDA', 'JIRON'], network: 'Vía urbana', candidate: 'Municipalidad provincial o distrital correspondiente', enforcement: 'Municipalidad y Policía Nacional del Perú', legalBasis: 'Ley 27972, Orgánica de Municipalidades' }];


export const ENTITY_PENDING = 'Entidad competente por verificar';