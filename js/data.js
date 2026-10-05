/* Datos por defecto: productor, catálogo de servicios y cláusulas base.
   Todo esto se puede editar desde el programa (pestañas Configuración y Cláusulas). */

window.DEFAULT_CONFIG = {
  productor: {
    nombre: "Piero Nilton Santos Bizarro",
    alias: "CLARENY",
    documento: "",
    ipi: "01145013405",
    pro: "BMI",
    editorial: "BeatStars Publishing",
    email: "contact@clareny.com",
    whatsapp: "",
    web: "clareny.com",
    ciudad: "Montevideo, Uruguay",
    empresa: "GRAYKIDS RECORDS",
    empresaNota: "(en formación)",
    mostrarEmpresa: true,
  },
  /* Condiciones con las que arranca cada contrato nuevo (pestaña "Mis datos"). */
  condiciones: {
    regalias: "no", puntosPct: 3, puntosPeriodo: "semestral",
    compProductor: "no", productorComp: 50,
    rapidosMaster: "2, 3, 5, 10", rapidosComp: "25, 33.33, 50",
  },
  prefijoId: "WFH",
  contador: {},
  monedaDefecto: "USD",
  firmaProductor: null,
  /* "incluye" / "noIncluye" son el paquete (como una cotización). Se pueden personalizar en cada contrato.
     derechos: "composicion" = crea la canción (contrato de producción); "tecnico" = solo servicio, sin derechos de autor. */
  servicios: [
    { id: "combo", entrega: "cancion", nombre: "Producción completa desde cero (beat + voces + mezcla + master)", unidad: "canción", precio: 79, moneda: "USD", revisiones: 6, stems: true, grupo: "produccion", derechos: "composicion",
      incluye: "Custom beat desde cero; Mezcla de voces (afinación, corrección, sincronización de tiempos, dinámica y compresión, EQ, EQ mid/side y estéreo, diseño vocal, efectos y automatizaciones); Mezcla de toda la canción; Masterización",
      noIncluye: "Grabación de voces; Stems / multitracks (se cotizan aparte)",
      revDesc: "sobre estructura, edición, afinación y acople de voces (cada ronda equivale a media hora de trabajo)" },
    { id: "remake", entrega: "instrumental", nombre: "Remake Beat", unidad: "beat", precio: 30, moneda: "USD", revisiones: 2, stems: false, grupo: "beat", derechos: "composicion",
      incluye: "Recreación del beat de referencia, con cambios sutiles; Master de la instrumental",
      noIncluye: "Grabación; Voces y mezcla vocal; Cambios estructurales mayores; Stems (adicional)",
      revDesc: "sobre mezcla, tono, ecualización y detalles similares; no incluye cambios estructurales mayores (cada ronda equivale a media hora de trabajo)" },
    { id: "custom", entrega: "instrumental", nombre: "Custom Beat", unidad: "beat", precio: 50, moneda: "USD", revisiones: 4, stems: false, grupo: "beat", derechos: "composicion",
      incluye: "Beat personalizado desde cero, según el estilo del artista; Master de la instrumental",
      noIncluye: "Grabación; Voces y mezcla vocal; Stems (adicional)",
      revDesc: "sobre arreglos e instrumentación (cada ronda equivale a media hora de trabajo)" },
    { id: "upgrade", entrega: "instrumental", nombre: "Upgrade Beat (incluye mezcla)", unidad: "beat", precio: 0, revisiones: 3, stems: false, grupo: "beat", derechos: "composicion",
      incluye: "Mejora de la instrumental hecha por el artista; Mezcla de la instrumental",
      noIncluye: "Grabación; Voces y mezcla vocal; Beat nuevo desde cero; Stems (adicional)",
      revDesc: "sobre la instrumental mejorada y su mezcla" },
    { id: "grabacion", entrega: "voces", nombre: "Grabación de voces", unidad: "hora", precio: 500, moneda: "UYU", revisiones: 0, stems: false, grupo: "audio", derechos: "tecnico",
      incluye: "Sesión de 1 hora (+10 minutos); Tips vocales y ayuda con la estructura; Entrega de las pistas grabadas",
      noIncluye: "Edición vocal; Mezcla; Master; Beat / producción",
      revDesc: "se factura por tiempo de sesión; no incluye rondas de revisión" },
    { id: "edicion", entrega: "vocal", nombre: "Edición vocal (afinación, tempo, limpieza)", unidad: "canción", precio: 0, revisiones: 2, stems: false, grupo: "audio", derechos: "tecnico",
      incluye: "Afinación, tempo y limpieza sobre voces ya grabadas",
      noIncluye: "Grabación; Mezcla; Master; Beat",
      revDesc: "sobre afinación, timing y limpieza de las secciones contratadas" },
    { id: "mezcla", entrega: "vocal", nombre: "Mezcla vocal", unidad: "vocal", sinTitulo: true, precio: 0, revisiones: 3, stems: false, grupo: "audio", derechos: "tecnico",
      incluye: "Mezcla de las voces ya grabadas sobre el beat (color, efectos y balance)",
      noIncluye: "Grabación; Master (contratá Mezcla + Master si lo querés incluido); Beat; Stems (adicional)",
      revDesc: "sobre balance, efectos y color de la voz" },
    { id: "master", entrega: "master", nombre: "Masterización", unidad: "canción", precio: 0, revisiones: 2, stems: false, grupo: "audio", derechos: "tecnico",
      incluye: "Master final listo para distribución",
      noIncluye: "Grabación; Mezcla; Beat",
      revDesc: "sobre volumen, tonalidad general y formato de entrega" },
    { id: "mixmaster", entrega: "vocal", nombre: "Mezcla + Master", unidad: "canción", precio: 1200, moneda: "UYU", revisiones: 2, stems: false, grupo: "audio", derechos: "tecnico",
      incluye: "Edición profesional de las voces (afinación, corrección y sincronización de tiempos); Mezcla de las voces sobre la instrumental; Masterización; Entrega en 1 a 4 días hábiles",
      noIncluye: "Grabación; Beat / producción; Stems (adicional)",
      revDesc: "sobre balance, efectos, volumen final y formato de entrega" },
    { id: "paquete", entrega: "cancion", nombre: "Paquete completo (Grabación + Mezcla + Master)", unidad: "canción", precio: 1700, moneda: "UYU", revisiones: 2, stems: false, grupo: "audio", derechos: "tecnico",
      incluye: "Grabación de voces (1 hora + 10 minutos); Edición profesional; Mezcla de las voces sobre la instrumental; Masterización; Entrega en 1 a 4 días hábiles después de la sesión",
      noIncluye: "Beat / producción; Stems (adicional)",
      revDesc: "sobre la mezcla: balance, efectos, volumen final y formato de entrega" },
    { id: "mezclacancion", entrega: "cancion", nombre: "Mezcla de canción completa por stems (incluye master)", unidad: "canción", precio: 0, revisiones: 2, stems: false, grupo: "audio", derechos: "tecnico",
      incluye: "Mezcla de toda la canción por stems (voces + instrumental); Masterización; El artista envía las voces grabadas y los stems",
      noIncluye: "Grabación; Producción del beat; Entrega de stems (salvo que se contraten aparte)",
      revDesc: "sobre balance general, efectos, volumen final y formato de entrega" },
    { id: "sesion", entrega: "otro", nombre: "Sesión en vivo uno a uno (Discord)", unidad: "hora", precio: 0, revisiones: 0, stems: false, grupo: "extra", derechos: "tecnico",
      incluye: "Videollamada uno a uno por Discord para escuchar, definir referencias y trabajar en vivo",
      noIncluye: "Beat, mezcla, master o grabación (se contratan aparte)",
      revDesc: "se factura por tiempo de sesión; no incluye rondas de revisión" },
    { id: "stems", entrega: "stems", nombre: "Stems / Multitracks (adicional)", unidad: "canción", precio: 0, revisiones: 0, stems: true, grupo: "extra", derechos: "tecnico",
      incluye: "Instrumental separada por partes (batería, bajo, melodías, efectos, etc.)",
      noIncluye: "Beat nuevo; Mezcla; Master",
      revDesc: "" },
    { id: "otro", entrega: "otro", nombre: "Servicio personalizado", unidad: "unidad", precio: 0, revisiones: 0, stems: false, grupo: "extra", derechos: "tecnico",
      incluye: "",
      noIncluye: "",
      revDesc: "según lo acordado en el Anexo B" },
  ],
};

/* Tipo de trabajo: lo deciden los servicios del Anexo B (o se fija a mano en la pestaña "Contrato"). */
window.TIPOS_TRABAJO = {
  produccion: {
    nombre: "Producción musical",
    corto: "Producción musical (obra nueva)",
    detalle: "Hay un beat o una producción: el productor crea música y puede tener derechos de composición y un porcentaje del Master.",
    titulo: "WORK-FOR-HIRE / ACUERDO DE PRODUCCIÓN MUSICAL",
  },
  servicio: {
    nombre: "Servicio de audio",
    corto: "Servicio de audio (técnico, sin derechos de autor del productor)",
    detalle: "Solo grabación, edición, mezcla o master: el productor no crea la canción y no reclama derechos de autor. El Master es del artista, salvo que se pacte un porcentaje.",
    titulo: "ACUERDO DE SERVICIOS DE AUDIO · GRABACIÓN, MEZCLA Y MASTERIZACIÓN",
  },
};

/* Datos de los servicios antes del catálogo con precios; se usan para no pisar lo que editaste. */
window.SERVICIOS_ANTERIORES = {
  combo: { nombre: "Combo Identidad (Producción completa + mezcla vocal)", incluye: "Canción con enfoque íntimo: producción completa, mezcla vocal creativa y un beat modificable, como un puzzle", revDesc: "sobre estructura, edición, afinación y acople de voces" },
  remake: { incluye: "Se recrea el beat de referencia con cambios sutiles", revDesc: "sobre mezcla, tono, ecualización y detalles similares; no incluye cambios estructurales mayores" },
  custom: { incluye: "Instrumental nueva, al estilo y a la idea del artista", revDesc: "sobre arreglos e instrumentación" },
  grabacion: { incluye: "Registro de las voces para su posterior edición y mezcla" },
  mixmaster: { nombre: "Mezcla + Masterización", incluye: "Mezcla vocal y master final listo para distribución", revisiones: 3 },
};

/* "Qué incluye" justo antes de separar Incluye / No incluye. Si en Mis datos sigue igual, se actualiza. */
window.INCLUYE_ANTERIOR = {
  combo: "Custom beat desde cero; mezcla de voces (afinación, corrección, sincronización de tiempos, dinámica y compresión, ecualización: EQ, EQ mid/side y estéreo, diseño vocal, efectos y automatizaciones creativas); mezcla de toda la canción y masterización. No incluye grabación",
  remake: "Recreación del beat de referencia elegido por el artista, con cambios sutiles. Incluye master",
  custom: "Beat personalizado desde cero, según el estilo y la identidad del artista. Incluye master",
  upgrade: "Se mejora la instrumental hecha por el artista, con mezcla incluida",
  grabacion: "Sesión de grabación de voces de 1 hora (+10 minutos), con tips vocales y ayuda con la estructura de la canción. Se entregan las pistas grabadas",
  edicion: "Trabajo puntual sobre voces ya grabadas",
  mezcla: "Mezcla de las voces ya grabadas sobre el beat, con el color que busca el artista",
  master: "Master final listo para distribución",
  mixmaster: "Edición profesional de las voces (afinación, corrección y sincronización de tiempos), mezcla de las voces sobre la instrumental y masterización incluida. Entrega en 1 a 4 días hábiles",
  paquete: "Sesión de grabación de voces de 1 hora (+10 minutos), edición profesional, mezcla de las voces sobre la instrumental y masterización incluida. Entrega en 1 a 4 días hábiles después de la sesión",
  mezclacancion: "Mezcla de todas las pistas de la canción (voces e instrumental separada en stems) y masterización incluida. El artista envía sus voces grabadas y los stems de la instrumental",
  sesion: "Videollamada uno a uno por Discord para escuchar, definir referencias y trabajar en vivo",
  stems: "Instrumental separada por partes",
};

window.TIPOS_CLIENTE = {
  individual: "Un artista",
  colab: "Varios artistas (colaboración / feat.)",
  duo: "Agrupación",
  sello: "Sello / Empresa",
};

/* Sencillo / EP / álbum: el cliente ve a qué obra corresponde el acuerdo. */
window.FORMATOS_OBRA = {
  sencillo: {
    nombre: "Sencillo",
    sufijo: "Sencillo",
    corto: "Sencillo · una sola canción (este acuerdo no cubre un álbum ni un EP)",
    detalle: "Al ser un sencillo no corresponde un nombre de proyecto más amplio. En el contrato figura «Nombre de la canción — Sencillo».",
  },
  ep: {
    nombre: "EP",
    sufijo: "EP",
    corto: "EP · varias canciones en un mismo lanzamiento (no es un álbum)",
    detalle: "El nombre del acuerdo es el del EP. Las canciones van en el Anexo B.",
  },
  album: {
    nombre: "Álbum",
    sufijo: "Álbum",
    corto: "Álbum / LP · las canciones van en el Anexo B",
    detalle: "El nombre del acuerdo es el del álbum.",
  },
  otro: {
    nombre: "Otro",
    sufijo: "",
    corto: "Otro (mixtape, sesión, proyecto…)",
    detalle: "Un proyecto que no es sencillo, EP ni álbum. El nombre se muestra tal cual.",
  },
};

/* Qué recibe el cliente en cada canción/servicio (Anexo B · Formato de entrega). */
window.ENTREGABLES = {
  instrumental: "Instrumental completa (beat en estéreo)",
  cancion: "Canción completa: voces + instrumental, mezclada y masterizada",
  vocal: "Master vocal: voces mezcladas sobre la instrumental",
  master: "Master final listo para distribución",
  voces: "Pistas de voz grabadas (archivos separados, sin procesar)",
  acapella: "Acapella: voces solas procesadas",
  stems: "Stems / multitracks: instrumental separada por partes",
  otro: "Según lo detallado en Observaciones",
};

/* Opciones de clareny.com para describir cada servicio. */
window.GENEROS = ["Trap", "Rap", "R&B", "Reggaeton", "Drill", "Pop", "Afrobeats", "Lo-fi", "Soul", "House"];
window.NOTAS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
window.ENFOQUES_EDICION = { secciones: "por secciones", afinacion: "afinación", tempo: "tempo", limpieza: "limpieza vocal" };
window.SESIONES = { presencial: "Presencial", virtual: "Virtual (el artista graba por su cuenta o en un estudio)" };

window.FORMATOS_AUDIO = {
  wav16: "WAV 16 bit / 44,1 kHz",
  wav24: "WAV 24 bit / 44,1 kHz",
  wav24_48: "WAV 24 bit / 48 kHz",
  wav32: "WAV 32 bit float / 48 kHz",
};

window.LEY_AUTOR_URUGUAY = "la Ley N° 9.739 de Propiedad Literaria y Artística y sus modificativas, entre ellas la Ley N° 17.616";

window.MODALIDADES = {
  unidad: {
    nombre: "Por unidad",
    detalle: "Se contrata una (1) canción o un (1) servicio individual, con el precio, alcance y entrega indicados en el Anexo B.",
  },
  cantidad: {
    nombre: "Por cantidad / paquete",
    detalle: "Se contratan varias canciones o servicios en un mismo paquete. El Anexo B funciona como “Schedule of Tracks” y detalla cada pista, su precio y su estado.",
  },
  servicio: {
    nombre: "Servicio específico",
    detalle: "Se contrata únicamente el servicio puntual indicado en el Anexo B (por ejemplo: grabación por horas, edición, mezcla o masterización), sin producción musical adicional salvo pacto escrito.",
  },
  marco: {
    nombre: "Acuerdo marco",
    detalle: "Este documento fija las condiciones generales. Cada nueva canción o servicio podrá incorporarse mediante un nuevo Anexo B aceptado por escrito por las partes, sin necesidad de rehacer el acuerdo completo.",
  },
};

window.ACTIVACIONES = {
  cancion: "Por canción: el 100% del Master de cada pista se transfiere al titular indicado para esa pista una vez pagado el saldo de esa pista.",
  proyecto: "Por proyecto: el 100% de los Masters incluidos en el Anexo B se transfiere una vez pagado el saldo total del proyecto.",
};

/* Condiciones para incluir cláusulas en modo "Auto". */
window.CONDICIONES = {
  siempre: "Siempre",
  produccion: "Si es producción musical (hay beat o producción)",
  servicio: "Si es solo servicio de audio (sin derechos de autor)",
  multiArtista: "Si hay agrupación, colaboración o varios artistas",
  sello: "Si el cliente es sello/empresa",
  remake: "Si hay un Remake Beat",
  audio: "Si hay grabación, edición, mezcla o master",
  marco: "Si es acuerdo marco",
};

/* Placeholders disponibles dentro del texto de las cláusulas. */
window.PLACEHOLDERS = [
  ["{{productor}}", "Nombre legal del productor"],
  ["{{alias}}", "Nombre artístico (CLARENY)"],
  ["{{ipi}}", "Número IPI"],
  ["{{pro}}", "Sociedad de gestión (BMI)"],
  ["{{email_productor}}", "Email del productor"],
  ["{{empresa}}", "GRAYKIDS RECORDS"],
  ["{{productor_identificacion}}", "Frase completa que identifica al productor"],
  ["{{cliente}}", "Nombre del cliente"],
  ["{{proyecto}}", "Nombre de la obra (con «— Sencillo», EP o Álbum si lo elegiste)"],
  ["{{modalidad}}", "Modalidad elegida"],
  ["{{modalidad_detalle}}", "Explicación de la modalidad"],
  ["{{activacion}}", "Modalidad de transferencia del Master"],
  ["{{regalias_master}}", "Si cobrás puntos del Master o no (se elige en “Cliente y artistas”)"],
  ["{{reparto_composicion}}", "Frase del reparto música / letra según el Anexo A"],
  ["{{recaudacion_productor}}", "Cómo cobra el productor (sociedad y editorial)"],
  ["{{distribuidora}}", "Distribuidora del Master"],
  ["{{revisiones_lista}}", "Lista de revisiones de los servicios contratados"],
  ["{{plazo}}", "Plazo de entrega (ej: dos (2) semanas)"],
  ["{{custodia}}", "Días de custodia de archivos"],
  ["{{total}}", "Precio total"],
  ["{{anticipo}}", "Pago inicial"],
  ["{{saldo}}", "Saldo"],
  ["{{moneda}}", "Moneda"],
  ["{{ley}}", "Ley aplicable"],
  ["{{jurisdiccion}}", "Jurisdicción / ciudad"],
  ["{{ley_autor}}", "Ley de derechos de autor aplicable"],
  ["{{plazo_saldo}}", "Plazo para pagar el saldo (solo si todavía hay saldo pendiente; no aparece si ya está pagado)"],
  ["{{reparto_por_pista}}", "Master y composición por canción (vacío si todas usan el criterio general)"],
  ["{{estado_pago}}", "Constancia de pagos realizados (se marca en “Plazos y pagos”)"],
  ["{{constancia_trabajo}}", "Constancia de trabajo ya realizado (se marca en “Plazos y pagos”)"],
  ["{{registro_master}}", "Quién registra y cobra el Master (distribuidora y SoundExchange)"],
  ["{{registro_composicion}}", "Reparto de la composición con el nombre de cada parte"],
  ["{{editorial_productor}}", "Tu administradora editorial"],
  ["{{registro_pro_productor}}", "Dónde registrás tu parte de autor (vacío si no recibís composición)"],
  ["{{registro_editorial_productor}}", "Dónde registrás tu parte editorial (vacío si no recibís composición)"],
  ["{{porcentajes_obra}}", "Aclaración de que los porcentajes valen solo para esta obra (solo en producción)"],
  ["{{creditos}}", "Créditos del productor según el tipo de trabajo"],
  ["{{servicios_lista}}", "Servicios contratados (ej: Grabación de voces y Mezcla + Master)"],
  ["{{titular_master}}", "Quién es dueño del Master"],
  ["{{master_servicio}}", "Porcentaje del Master en servicios de audio (0 % o el pactado)"],
];

window.CLAUSULAS_BASE = [
  { id: "c1", titulo: "IDENTIFICACIÓN DE LAS PARTES", cond: "siempre", texto:
`Entre, por una parte, {{productor_identificacion}}, en adelante “EL PRODUCTOR”; y por otra parte la persona, artistas, colectivo, sello o entidad identificada en la sección “Partes” de este acuerdo, en adelante “EL CLIENTE”.

Cuando EL CLIENTE sea una persona jurídica o sello, el firmante declara que posee facultades suficientes para obligar a la entidad respecto del presente acuerdo. Cuando participe un dúo, colectivo o varios artistas, se identificarán en el Anexo A como firmantes y/o contribuyentes del proyecto.` },

  { id: "c2", titulo: "OBJETO Y ALCANCE", cond: "siempre", texto:
`EL PRODUCTOR prestará los servicios musicales indicados en el Anexo B para el proyecto **{{proyecto}}**. El acuerdo podrá aplicarse a una sola canción o a múltiples canciones.

El alcance de cada pista, precio, entregables, número de revisiones y condición de transferencia se detalla por canción en el Anexo B, que forma parte integrante del presente acuerdo.` },

  { id: "c23", titulo: "ALCANCE, NO EXCLUSIVIDAD Y PROYECTOS FUTUROS", cond: "siempre", texto:
`Este acuerdo se refiere **únicamente al proyecto {{proyecto}}** y a las canciones o servicios detallados en el Anexo B. No se extiende a otras canciones ni a proyectos futuros.

- **Sin exclusividad:** ninguna de las partes queda obligada a trabajar en forma exclusiva con la otra. EL CLIENTE y los artistas pueden trabajar libremente con otros productores, estudios o colaboradores, y EL PRODUCTOR puede trabajar libremente con otros artistas.
- **Sin obligación de trabajos futuros:** EL PRODUCTOR no queda obligado a producir futuras canciones de EL CLIENTE, y EL CLIENTE no queda obligado a contratar a EL PRODUCTOR en el futuro.
{{porcentajes_obra}}

{{constancia_trabajo}}` },

  { id: "c3", titulo: "MODALIDAD DE CONTRATACIÓN", cond: "siempre", texto:
`La presente contratación se realiza bajo la modalidad: **{{modalidad}}**.

{{modalidad_detalle}}` },

  { id: "c4", titulo: "PAGO Y CONDICIÓN DE TRANSFERENCIA", cond: "siempre", texto:
`El precio total del proyecto es de **{{total}}**, con un pago inicial de **{{anticipo}}** y un saldo de **{{saldo}}**, según el detalle de los Anexos B y C. Salvo pacto expreso en contrario, la entrega de los archivos finales y la transferencia de los derechos económicos del Master quedan condicionadas al **pago total de la canción o del proyecto correspondiente**.

**Modalidad de activación del Master:** {{activacion}}

Mientras exista un saldo pendiente, EL PRODUCTOR podrá retener la entrega final y la transferencia de los derechos del Master correspondientes al saldo pendiente.

{{plazo_saldo}}

{{estado_pago}}` },

  { id: "c25", titulo: "SERVICIO TÉCNICO: SIN DERECHOS DE AUTOR DEL PRODUCTOR", cond: "servicio", texto:
`Los servicios de este acuerdo ({{servicios_lista}}) son **servicios técnicos de audio**. EL PRODUCTOR no es autor ni coautor de la composición (música y letra) y **no reclamará derechos de autor, editoriales ni de composición** sobre la obra, que corresponde íntegramente a sus autores. Cada autor la registra y la cobra por su cuenta, ante su sociedad de gestión y su editorial.

Las sugerencias que EL PRODUCTOR pueda dar durante el trabajo (tips vocales, ideas de estructura, arreglos o sugerencias de composición) son un valor agregado del servicio y **no generan coautoría ni porcentaje alguno**, salvo acuerdo escrito firmado por todas las partes.` },

  { id: "c26", titulo: "TITULARIDAD DEL MATERIAL Y DEL MASTER", cond: "servicio", texto:
`EL CLIENTE es y seguirá siendo titular de las voces, grabaciones, pistas, stems, instrumentales y demás material que entregue para el servicio, y declara contar con las autorizaciones necesarias sobre ese material.

Una vez pagado el precio, la mezcla, el master y los archivos que resulten del servicio corresponden a **{{titular_master}}**, que podrá distribuirlos y explotarlos libremente.

**Porcentaje del Master:** {{master_servicio}}` },

  { id: "c5", titulo: "CESIÓN DEL 100% DEL MASTER / FONOGRAMA", cond: "produccion", texto:
`Una vez cumplida la condición de pago aplicable, EL PRODUCTOR cederá al titular indicado en el Anexo B el **100% de los derechos patrimoniales que le correspondan sobre el Master/Fonograma final** creado dentro del servicio contratado, dentro de los derechos legalmente cedibles.

La cesión comprende, según corresponda: reproducción, distribución, puesta a disposición, comunicación pública, streaming, descarga, monetización, redes sociales, sincronización y licenciamiento a terceros.

La cesión del Master es independiente de los derechos de composición, autoría, interpretación y otros derechos que puedan corresponder a terceros.` },

  { id: "c6", titulo: "COMPOSICIÓN Y AUTORÍA", cond: "produccion", texto:
`Los derechos sobre la composición y los derechos sobre el Master/Fonograma son independientes. Las partes registran en el Anexo A los porcentajes de composición reales de cada autor.

**Regla de control:** los porcentajes de composición deben sumar exactamente **100%**. El hecho de que el ARTISTA reciba 100% del Master no significa automáticamente que reciba 100% de la composición.

Cuando EL PRODUCTOR realice aportes creativos que constituyan autoría, su porcentaje se consignará en el Anexo A y podrá ser registrado ante su sociedad de gestión ({{pro}}, IPI {{ipi}}). Si el servicio es exclusivamente técnico y no existe aporte autoral, se consignará 0% para EL PRODUCTOR.

**Registro en sistema 200%:** para el registro ante BMI u otras sociedades que separan la parte de autor de la parte editorial, las partes de autor (writer share) suman 100% y las partes editoriales (publisher share) suman otro 100%, según el cuadro de registro del Anexo A. Ese cuadro expresa el mismo reparto y no otorga porcentajes adicionales a ninguna de las partes.` },

  { id: "c22", titulo: "REGALÍAS, EDITORIAL Y SINCRONIZACIÓN", cond: "produccion", texto:
`**Regalías del Master:** {{regalias_master}}

**Regalías de la composición (derechos de autor y editoriales):** {{reparto_composicion}}

Cada autor percibirá directamente, a través de su propia sociedad de gestión colectiva y de su editorial o administradora editorial, las regalías autorales y editoriales (ejecución pública, reproducción mecánica y demás) que correspondan a su porcentaje del Anexo A. {{recaudacion_productor}} La cesión del Master no transfiere ni reduce la participación autoral de ninguna de las partes. Las partes registrarán la obra con esos mismos porcentajes y se facilitarán los datos necesarios para ello (nombre legal, IPI, sociedad de gestión y editorial).

**Editorial (publishing):** la participación de EL PRODUCTOR en la composición no se cede por este acuerdo. EL PRODUCTOR podrá administrarla por sí mismo o a través de la editorial que designe, incluida {{empresa}}. Nada en este acuerdo obliga a EL PRODUCTOR a ceder derechos editoriales a EL CLIENTE ni a terceros designados por este.

**Sincronización:** toda licencia que utilice la canción en obras audiovisuales (cine, series, publicidad, videojuegos u otros) requiere, además de la autorización del titular del Master, la autorización de los autores de la composición. Cada autor percibirá la parte de la tarifa de sincronización de la obra que corresponda a su porcentaje del Anexo A.

**Derechos conexos:** los derechos de productor fonográfico sobre el Master corresponden a su titular según el Anexo B, y los de intérprete a quienes hayan interpretado la grabación, conforme a la ley aplicable.

**Content ID y plataformas:** solo el titular del Master o su distribuidor podrá registrar el Master en sistemas de identificación de contenido (como Content ID de YouTube). EL PRODUCTOR no reclamará el Master en dichos sistemas, y EL CLIENTE no registrará ni licenciará la instrumental por separado como obra propia sin acuerdo escrito.

En remakes u obras basadas en composiciones preexistentes, los porcentajes del Anexo A se limitan a los aportes nuevos que reconozcan la ley y los titulares de la obra original.

{{reparto_por_pista}}` },

  { id: "c24", titulo: "REGISTRO DE LA OBRA Y COBRO DE REGALÍAS", cond: "produccion", texto:
`**A) Master (derechos fonográficos):** {{registro_master}}

**B) Composición (derechos de autor):** {{registro_composicion}} Cada parte registra y cobra únicamente su propio porcentaje; ninguna cobra en nombre de otra.

- **Ejecución pública:** cada parte registrará por separado su porcentaje en su propia sociedad de gestión colectiva o PRO (por ejemplo BMI, ASCAP, AGADU, SADAIC o SACM), con su código IPI/CAE.{{registro_pro_productor}}
- **Regalías mecánicas:** cada parte registrará su porcentaje a través de su propia administradora editorial o publisher (por ejemplo BeatStars Publishing, Songtrust, Symphonic Publishing u ONErpm Publishing), que lo cobra ante The MLC en EE. UU. y ante las entidades de cada país.{{registro_editorial_productor}}
- **Código ISRC:** el titular del Master comunicará a las demás partes el código ISRC definitivo de la grabación en cuanto lo reciba de su distribuidora. Cada parte lo cargará en su sociedad y en su plataforma de publishing, para que los datos coincidan y se eviten disputas de catálogo.
- **Libertad de elección:** cada parte elige libremente su sociedad de gestión, su distribuidora y su administradora editorial. Los nombres mencionados son solo ejemplos. El Anexo E incluye una guía informativa paso a paso.` },

  { id: "c7", titulo: "DÚOS, COLECTIVOS Y MÚLTIPLES ARTISTAS", cond: "multiArtista", texto:
`Cuando participen dos o más artistas, todos los participantes con derechos o responsabilidades se identifican en el Anexo A. Cada firmante acepta las obligaciones que le correspondan.

Los artistas podrán designar a uno de ellos como representante operativo para comunicaciones, revisiones y coordinación del proyecto. Dicha designación no modifica por sí misma los porcentajes de composición ni la titularidad del Master.

Si uno de los artistas firma en nombre de los demás sin contar con autorización suficiente, será responsable de la veracidad de dicha representación en la medida permitida por la ley.` },

  { id: "c8", titulo: "SELLOS, EMPRESAS Y AUTORIDAD PARA CONTRATAR", cond: "sello", texto:
`Cuando EL CLIENTE sea un sello o empresa, el representante firmante declara que la entidad tiene autoridad para contratar los servicios y recibir la cesión del Master indicada en el Anexo B.

EL CLIENTE/Sello será responsable de obtener y mantener las autorizaciones necesarias de sus artistas, intérpretes, compositores o terceros. Si la titularidad del Master se repartirá entre el sello y uno o más artistas, dicha distribución deberá indicarse expresamente por canción.

La cesión de derechos que EL PRODUCTOR pueda realizar queda limitada a los derechos que efectivamente tenga y pueda ceder.` },

  { id: "c9", titulo: "MATERIALES DE TERCEROS Y REMAKES", cond: "remake", texto:
`Cuando EL CLIENTE solicite un remake, recreación o producción basada en un beat u obra preexistente, EL PRODUCTOR advierte que una similitud sustancial puede generar reclamaciones de propiedad intelectual.

EL CLIENTE declara que ha sido informado de ese riesgo y será responsable de verificar las autorizaciones necesarias sobre beats, samples, loops, composiciones, grabaciones y otros materiales de terceros que proporcione o cuya reproducción solicite.

El presente acuerdo no otorga al CLIENTE derechos que EL PRODUCTOR no posea sobre una obra de terceros.` },

  { id: "c10", titulo: "INDEMNIDAD", cond: "siempre", texto:
`En la medida permitida por la legislación aplicable, EL CLIENTE mantendrá indemne a EL PRODUCTOR frente a reclamaciones de terceros originadas directamente en materiales sin autorización entregados por EL CLIENTE, instrucciones específicas del CLIENTE para reproducir obras de terceros, o declaraciones falsas sobre la titularidad o autorización de materiales proporcionados.

Esta cláusula no pretende excluir responsabilidades que legalmente no puedan excluirse mediante contrato.` },

  { id: "c11", titulo: "ENTREGA BASE, STEMS Y MULTITRACKS", cond: "siempre", texto:
`Cada canción o servicio se entrega con el contenido y el formato de audio indicados en el Anexo B (tabla “Formato de entrega”). Como referencia:
- **Beats (Remake, Custom, Upgrade):** instrumental completa en estéreo.
- **Producción completa:** canción final con voces e instrumental, mezclada y masterizada.
- **Edición y mezcla vocal:** master vocal, es decir, las voces procesadas y mezcladas sobre la instrumental.
- **Masterización:** master final listo para distribución.
- **Grabación:** pistas de voz grabadas, en archivos separados.

Los **Stems / Multitracks** son la instrumental separada por partes (batería, bajo, melodías, efectos, etc.). Son un **servicio adicional con pago aparte**, salvo que el Anexo B indique que están incluidos, y se envían una vez pagados.

Salvo indicación diferente en el Anexo B, el audio se entrega en **WAV 16 bit / 44,1 kHz** y **MP3 320 kbps**. Los entregables no indicados en el Anexo B (acapella, versión instrumental, versión limpia, formatos adicionales, etc.) podrán cotizarse por separado.` },

  { id: "c12", titulo: "REVISIONES Y LÍMITES", cond: "siempre", texto:
`Para los servicios contratados en este acuerdo se aplican los siguientes límites de revisión:
{{revisiones_lista}}

Las revisiones adicionales o fuera del alcance podrán cotizarse por separado.` },

  { id: "c13", titulo: "GRABACIÓN, MEZCLA, MASTERIZACIÓN Y MATERIAL RECIBIDO", cond: "audio", texto:
`En servicios independientes de grabación, edición, mezcla o masterización, el precio y plazo dependen de la cantidad y calidad de los archivos proporcionados por EL CLIENTE. Las sesiones deberán entregarse organizadas, consolidadas y técnicamente utilizables.

Pistas adicionales, sesiones desorganizadas, nuevas grabaciones o modificaciones sustanciales podrán generar cargos y/o cambios de plazo. Las sesiones de grabación reservadas que no se cancelen con al menos 24 horas de anticipación podrán cobrarse.

**Voces grabadas por el artista:** cuando EL CLIENTE grabe sus voces por su cuenta y las envíe (por ejemplo, artistas de otro país), deberá enviarlas en WAV (24 bit recomendado), sin efectos ni procesamiento, todas desde el inicio de la canción y junto con la instrumental o los stems en su versión final. La calidad de la grabación original limita el resultado de la mezcla.` },

  { id: "c14", titulo: "PLAZO DE ENTREGA Y APROBACIÓN", cond: "siempre", texto:
`El plazo máximo estimado de entrega final será de **{{plazo}}**, contado desde que se hayan cumplido: (i) las condiciones de pago requeridas para iniciar, (ii) la recepción de todos los materiales necesarios y (iii) las instrucciones suficientes para trabajar.

El plazo se suspenderá durante cualquier demora del CLIENTE en enviar materiales, revisiones o aprobaciones.

La entrega se considerará aprobada cuando EL CLIENTE la acepte expresamente o cuando publique, distribuya o utilice comercialmente el Master.` },

  { id: "c15", titulo: "CUSTODIA DE ARCHIVOS Y RECUPERACIÓN", cond: "siempre", texto:
`EL PRODUCTOR conservará una copia de seguridad del Master y de las sesiones durante **{{custodia}}**, contados desde la entrega final y aprobación. Vencido dicho período, EL PRODUCTOR no estará obligado a conservar los archivos de proyecto.

Si EL CLIENTE solicita recuperación posterior y los archivos aún existen, podrá aplicarse la tarifa de recuperación indicada en el Anexo C.` },

  { id: "c16", titulo: "USO PROMOCIONAL Y CRÉDITOS", cond: "siempre", texto:
`Salvo acuerdo escrito diferente, EL CLIENTE autoriza a EL PRODUCTOR a utilizar fragmentos razonables del proyecto terminado con fines de portfolio, redes sociales, página web y promoción profesional. Este uso no transfiere al PRODUCTOR la propiedad del Master ni autoriza su explotación comercial independiente.

{{creditos}}` },

  { id: "c17", titulo: "FIRMA ELECTRÓNICA Y ACEPTACIÓN DIGITAL", cond: "siempre", texto:
`Las partes acuerdan que este documento podrá firmarse mediante firma manuscrita, firma electrónica (incluida la firma dibujada en pantalla junto con la identificación del firmante) o firma electrónica avanzada, reconociéndoles plena validez entre ellas en la medida permitida por la legislación aplicable.

Las partes aceptan que el documento electrónico firmado, junto con su registro de firma (nombre, documento de identidad, correo, fecha y hora, dispositivo y código de verificación del documento), los comprobantes de pago y la evidencia de envío y entrega, podrá utilizarse para acreditar la aceptación del acuerdo.

Cada firmante declara haber leído el documento completo antes de firmar. La versión final con todas las firmas será considerada la copia de referencia entre las partes.` },

  { id: "c18", titulo: "COMUNICACIONES Y APROBACIONES", cond: "siempre", texto:
`Las partes podrán coordinar el proyecto por correo electrónico, WhatsApp u otros medios acordados. Las instrucciones creativas, aprobaciones de versiones y cambios de alcance deberán quedar documentados de manera que pueda identificarse razonablemente a la persona que los realizó.

Para nuevos proyectos bajo este acuerdo, las partes podrán aprobar un nuevo Anexo B mediante firma electrónica o aceptación escrita que permita identificar a ambas partes.` },

  { id: "c19", titulo: "SERVICIOS ADICIONALES", cond: "siempre", texto:
`Todo trabajo no incluido expresamente en el precio de una pista será considerado adicional. Esto puede incluir Stems, multitracks, nuevas versiones, acapellas, ediciones posteriores, grabaciones adicionales, cambios estructurales después de la aprobación, nuevas mezclas o recuperación de sesiones.` },

  { id: "c20", titulo: "INTEGRIDAD Y MODIFICACIONES", cond: "siempre", texto:
`Este documento y sus anexos constituyen el acuerdo entre las partes respecto de los proyectos identificados. Cualquier modificación deberá realizarse por escrito y ser aceptada por las partes.

Si alguna disposición resulta inválida o inaplicable, las demás disposiciones continuarán vigentes en la medida permitida por la legislación aplicable.` },

  { id: "c21", titulo: "LEGISLACIÓN Y RESOLUCIÓN DE CONTROVERSIAS", cond: "siempre", texto:
`Este acuerdo se rige por la legislación de **{{ley}}**. Para cualquier controversia, las partes se someten a los tribunales competentes de **{{jurisdiccion}}**.

En materia de derechos de autor y derechos conexos se aplican **{{ley_autor}}**, así como los tratados internacionales sobre la materia vigentes en dicho país.

Las partes procurarán resolver de buena fe cualquier controversia antes de iniciar procedimientos formales.` },
];
