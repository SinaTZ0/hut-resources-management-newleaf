export type SeedEntity = {
  name: string
  description?: string | null
  fields: Record<string, any>
  records: Array<{ fieldValues: Record<string, any>; metadata?: Record<string, any> | null }>
}

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length]
}

function generateRange(count: number) {
  return Array.from({ length: count }, (_, i) => i + 1)
}

function genSerial(prefix: string, idx: number) {
  // deterministic serial generator
  return `${prefix}${(1000 + idx).toString(36).toUpperCase()}`
}

function generateCiscoSwitchRecords(count = 12) {
  const models = [
    'Catalyst 9300-48P',
    'Catalyst 9300-24T',
    'Catalyst 9200-24T',
    'Catalyst 9200-48T',
  ]
  const statuses = ['active', 'maintenance', 'retired']
  const records = generateRange(count).map((i) => ({
    fieldValues: {
      model: pick(models, i),
      serial_number: genSerial('FCW', i),
      rack_unit_size: pick([1, 2, 3], i),
      managed: pick([true, false], i),
      status: pick(statuses, i),
    },
    metadata: {
      fiber_ports: pick([4, 8, 12], i),
      ethernet_ports: pick([24, 48, 48], i),
      poe_supported: pick([true, false], i),
    },
  }))
  return records
}

function generateCiscoRouterRecords(count = 12) {
  const models = ['ISR 4451-X', 'ISR 4331', 'ISR 4321']
  const statuses = ['active', 'maintenance', 'retired']
  return generateRange(count).map((i) => ({
    fieldValues: {
      model: pick(models, i),
      serial_number: genSerial('FTX', i),
      wan_port_count: pick([1, 2, 4], i),
      max_throughput_gbps: pick([1, 10, 40], i),
      managed: pick([true, false], i),
      status: pick(statuses, i),
    },
    metadata: {
      wan_ports: pick([1, 2, 4], i),
      max_throughput_gbps: pick([1, 10, 40], i),
    },
  }))
}

function generateHPServerRecords(count = 12) {
  const models = ['ProLiant DL380 Gen10', 'ProLiant DL360 Gen10', 'ProLiant ML110 Gen10']
  const statuses = ['active', 'maintenance', 'retired']
  return generateRange(count).map((i) => ({
    fieldValues: {
      model: pick(models, i),
      serial_number: genSerial('SGH', i),
      cpu_model: pick(
        ['Intel Xeon Gold 6248', 'Intel Xeon Silver 4216', 'Intel Xeon Bronze 3104'],
        i
      ),
      ram_gb: pick([64, 128, 256, 384], i),
      storage_tb: pick([2, 4, 8, 12], i),
      rack_unit_size: pick([1, 2, 4], i),
      status: pick(statuses, i),
    },
    metadata: pick(
      [
        { power_supply_count: 2, raid_controller: 'P408i-a' },
        { power_supply_count: 1, raid_controller: 'P408i-a' },
        null,
      ],
      i
    ),
  }))
}

function generateChairRecords(count = 12) {
  const materials = ['fabric', 'leather', 'plastic', 'mesh']
  const colors = ['black', 'brown', 'grey', 'white']
  return generateRange(count).map((i) => ({
    fieldValues: {
      material: pick(materials, i),
      has_wheels: pick([true, false], i),
      color: pick(colors, i),
      adjustable_height: pick([true, false], i),
    },
    metadata: null,
  }))
}

export const ENTITIES: SeedEntity[] = [
  {
    name: 'Cisco Switch',
    description: 'Catalyst series access switch',
    fields: {
      model: { type: 'string', label: 'Model', order: 0, required: true, sortable: true },
      serial_number: {
        type: 'string',
        label: 'Serial Number',
        order: 1,
        required: true,
        sortable: false,
      },
      rack_unit_size: {
        type: 'number',
        label: 'Rack Unit Size',
        order: 2,
        required: true,
        sortable: true,
      },
      managed: { type: 'boolean', label: 'Managed', order: 3, required: true, sortable: false },
      status: {
        type: 'enum',
        label: 'Status',
        order: 4,
        required: true,
        sortable: true,
        enumOptions: ['active', 'maintenance', 'retired'],
      },
    },
    records: generateCiscoSwitchRecords(12),
  },

  {
    name: 'Cisco Router',
    description: 'ISR series edge router',
    fields: {
      model: { type: 'string', label: 'Model', order: 0, required: true, sortable: true },
      serial_number: {
        type: 'string',
        label: 'Serial Number',
        order: 1,
        required: true,
        sortable: false,
      },
      wan_port_count: {
        type: 'number',
        label: 'WAN Ports',
        order: 2,
        required: true,
        sortable: true,
      },
      max_throughput_gbps: {
        type: 'number',
        label: 'Max Throughput (Gbps)',
        order: 3,
        required: true,
        sortable: false,
      },
      managed: { type: 'boolean', label: 'Managed', order: 4, required: true, sortable: false },
      status: {
        type: 'enum',
        label: 'Status',
        order: 5,
        required: true,
        sortable: true,
        enumOptions: ['active', 'maintenance', 'retired'],
      },
    },
    records: generateCiscoRouterRecords(12),
  },

  {
    name: 'HP Server',
    description: 'ProLiant rack server',
    fields: {
      model: { type: 'string', label: 'Model', order: 0, required: true, sortable: true },
      serial_number: {
        type: 'string',
        label: 'Serial Number',
        order: 1,
        required: true,
        sortable: false,
      },
      cpu_model: { type: 'string', label: 'CPU Model', order: 2, required: true, sortable: false },
      ram_gb: { type: 'number', label: 'RAM (GB)', order: 3, required: true, sortable: true },
      storage_tb: {
        type: 'number',
        label: 'Storage (TB)',
        order: 4,
        required: true,
        sortable: true,
      },
      rack_unit_size: {
        type: 'number',
        label: 'Rack Unit Size',
        order: 5,
        required: true,
        sortable: false,
      },
      status: {
        type: 'enum',
        label: 'Status',
        order: 6,
        required: true,
        sortable: true,
        enumOptions: ['active', 'maintenance', 'retired'],
      },
    },
    records: generateHPServerRecords(12),
  },

  {
    name: 'Chair',
    description: 'Office chair',
    fields: {
      material: {
        type: 'enum',
        label: 'Material',
        order: 0,
        required: true,
        sortable: true,
        enumOptions: ['fabric', 'leather', 'plastic', 'mesh'],
      },
      has_wheels: {
        type: 'boolean',
        label: 'Has Wheels',
        order: 1,
        required: true,
        sortable: false,
      },
      color: { type: 'string', label: 'Color', order: 2, required: true, sortable: true },
      adjustable_height: {
        type: 'boolean',
        label: 'Adjustable Height',
        order: 3,
        required: true,
        sortable: false,
      },
    },
    records: generateChairRecords(12),
  },
]
