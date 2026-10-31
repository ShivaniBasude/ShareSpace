import {
  type Resource,
  ResourceCategory,
} from '../../../packages/shared/src/types';

// SVG data URIs for graceful, crisp inline visual representation without external network dependencies
const createSvgImage = (title: string, category: string, color: string, bg: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="${bg}"/>
    <circle cx="300" cy="170" r="70" fill="${color}" fill-opacity="0.12"/>
    <rect x="230" y="100" width="140" height="140" rx="24" fill="${color}" fill-opacity="0.2"/>
    <text x="300" y="270" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#1e293b" text-anchor="middle">${title}</text>
    <text x="300" y="300" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#64748b" text-anchor="middle">${category}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'res-elec-001',
    title: 'Precision GPU Workstation — Dell Precision 7920',
    description:
      'Dual Intel Xeon Silver processors with dual NVIDIA RTX A5000 24GB GPUs. Configured with PyTorch, TensorFlow, CUDA 12, and Docker for accelerated deep learning, computational fluid dynamics, and large language model fine-tuning.',
    category: ResourceCategory.Electronics,
    resourceType: 'Workstation',
    institutionId: 'univ-main',
    ownerId: 'faculty-cs-lab',
    location: 'Turing Computer Science Building, Lab 304',
    quantity: 6,
    availableQuantity: 4,
    condition: 'Excellent',
    images: [
      createSvgImage('GPU Workstation', 'Electronics', '#4f46e5', '#eef2ff'),
    ],
    specifications: {
      CPU: 'Dual Intel Xeon Silver 4314 (32 cores total)',
      RAM: '256GB DDR4 ECC Registered',
      GPU: '2x NVIDIA RTX A5000 (24GB VRAM each)',
      Storage: '4TB NVMe SSD + 16TB Enterprise RAID',
      OS: 'Ubuntu 24.04 LTS (HPC Stack)',
    },
    eligibilityRequirements: [
      'Active CS, Data Science, or Engineering graduate student',
      'Completed Lab Safety and Server Usage Briefing',
    ],
    availabilityStatus: 'available',
    approvalRequired: false,
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-28T14:30:00Z',
  },
  {
    id: 'res-lab-002',
    title: 'Digital Storage Oscilloscope — Keysight InfiniiVision 3000G',
    description:
      '4-channel 200 MHz digital storage oscilloscope with 5 GSa/s sampling rate, built-in waveform generator, and hardware-accelerated serial bus protocol decoding (I2C, SPI, UART, CAN).',
    category: ResourceCategory.Laboratory,
    resourceType: 'Oscilloscope',
    institutionId: 'univ-main',
    ownerId: 'faculty-ece-dept',
    location: 'Maxwell Engineering Hall, Microelectronics Lab 112',
    quantity: 3,
    availableQuantity: 2,
    condition: 'Like New',
    images: [
      createSvgImage('Keysight Oscilloscope', 'Laboratory Equipment', '#0284c7', '#f0f9ff'),
    ],
    specifications: {
      Bandwidth: '200 MHz (upgradeable)',
      Channels: '4 analog + 16 digital MSO',
      SamplingRate: '5 GSa/s',
      MemoryDepth: '4 Mpts',
      Screen: '8.5-inch WVGA capacitive touch',
    },
    eligibilityRequirements: [
      'Enrolled in ECE circuit analysis or embedded systems laboratory',
      'Must return with all 4 passive 10:1 voltage probes',
    ],
    availabilityStatus: 'available',
    approvalRequired: true,
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-10-30T16:15:00Z',
  },
  {
    id: 'res-creative-003',
    title: '4K Cinema Production Kit — Sony FX6 Full-Frame',
    description:
      'Full-frame cinematic video camera with Sony FE 24-70mm f/2.8 GM II lens, dual wireless lavalier microphones, matte box, carbon fiber tripod, and two 160GB CFexpress Type A high-speed cards.',
    category: ResourceCategory.Creative,
    resourceType: 'Camera Kit',
    institutionId: 'univ-main',
    ownerId: 'media-arts-dept',
    location: 'Media Arts Center, Equipment Checkout Depot Room 12',
    quantity: 2,
    availableQuantity: 0,
    condition: 'Good',
    images: [
      createSvgImage('Sony FX6 Cinema Kit', 'Creative Equipment', '#9333ea', '#faf5ff'),
    ],
    specifications: {
      Sensor: '10.2 MP Full-Frame Back-Illuminated Exmor R CMOS',
      VideoRecording: '4K DCI up to 120fps, 10-bit 4:2:2 All-Intra',
      Audio: 'Dual XLR inputs with phantom power',
      LensMount: 'Sony E-mount',
    },
    eligibilityRequirements: [
      'Film, Journalism, or New Media student with Production II certification',
      'Insurance declaration waiver on file',
    ],
    availabilityStatus: 'reserved',
    approvalRequired: true,
    createdAt: '2026-08-15T09:30:00Z',
    updatedAt: '2026-10-31T09:00:00Z',
  },
  {
    id: 'res-room-004',
    title: 'Silent Acoustic Study Pod C-12',
    description:
      'Soundproof single-occupant focus pod featuring adaptive LED circadian lighting, ergonomic Herman Miller seating, dual USB-C 65W charging ports, and HEPA ventilation.',
    category: ResourceCategory.Rooms,
    resourceType: 'Study Pod',
    institutionId: 'univ-main',
    ownerId: 'campus-library-staff',
    location: 'Central Library, 3rd Floor East Wing',
    quantity: 1,
    availableQuantity: 1,
    condition: 'Like New',
    images: [
      createSvgImage('Acoustic Study Pod', 'Rooms & Spaces', '#10b981', '#ecfdf5'),
    ],
    specifications: {
      AcousticRating: 'NIC 32 Sound Isolation',
      Capacity: '1 person',
      Connectivity: 'Wi-Fi 6E, 2x AC power, 2x USB-C PD',
      Ventilation: 'Continuous air exchange (35 m³/h)',
    },
    eligibilityRequirements: [
      'Open to all registered university students',
      'Maximum session limit: 3 hours per booking',
    ],
    availabilityStatus: 'available',
    approvalRequired: false,
    createdAt: '2026-09-05T11:00:00Z',
    updatedAt: '2026-10-31T11:45:00Z',
  },
  {
    id: 'res-book-005',
    title: 'Introduction to Algorithms (CLRS) — 4th Edition Hardcover',
    description:
      'The comprehensive reference textbook on computational algorithms by Cormen, Leiserson, Rivest, and Stein. Essential reading for Data Structures, Analysis of Algorithms, and Competitive Programming.',
    category: ResourceCategory.Books,
    resourceType: 'Textbook',
    institutionId: 'univ-main',
    ownerId: 'campus-library-staff',
    location: 'Central Library, Reserve Collection Shelf QA76.6.C662',
    quantity: 8,
    availableQuantity: 6,
    condition: 'Good',
    images: [
      createSvgImage('CLRS Algorithms', 'Books & Materials', '#ea580c', '#fff7ed'),
    ],
    specifications: {
      Edition: '4th Edition (MIT Press)',
      Pages: '1312 pages',
      ISBN: '978-0262046305',
      Format: 'Hardcover with digital supplemental companion code',
    },
    eligibilityRequirements: [
      'Standard student ID check-out',
      'Loan period: up to 14 consecutive calendar days',
    ],
    availabilityStatus: 'available',
    approvalRequired: false,
    createdAt: '2026-08-20T08:00:00Z',
    updatedAt: '2026-10-25T13:20:00Z',
  },
  {
    id: 'res-elec-006',
    title: 'Meta Quest Pro Mixed Reality Development Kit',
    description:
      'High-resolution spatial computing headset with full-color passthrough, eye tracking, natural facial expression recognition, and self-tracking Touch Pro controllers. Pre-registered in university developer organization.',
    category: ResourceCategory.Electronics,
    resourceType: 'VR Headset',
    institutionId: 'univ-main',
    ownerId: 'xr-lab-manager',
    location: 'Interactive Media Pavilion, XR Innovation Studio 208',
    quantity: 4,
    availableQuantity: 3,
    condition: 'Excellent',
    images: [
      createSvgImage('Meta Quest Pro', 'Electronics', '#4f46e5', '#eef2ff'),
    ],
    specifications: {
      Optics: 'Pancake lenses, 1800 x 1920 pixels per eye',
      RefreshRate: '90 Hz',
      Passthrough: 'Stereoscopic mixed reality color camera array',
      RAM: '12GB unified memory with Snapdragon XR2+ Gen 1',
    },
    eligibilityRequirements: [
      'Enrolled in Virtual Reality, Game Design, or HCI coursework',
      'Signed hardware check-out agreement',
    ],
    availabilityStatus: 'available',
    approvalRequired: false,
    createdAt: '2026-09-12T14:00:00Z',
    updatedAt: '2026-10-29T10:10:00Z',
  },
  {
    id: 'res-lab-007',
    title: 'High-Resolution Research Stereo Microscope — Olympus SZ61',
    description:
      'Zoom stereo microscope with 6.7:1 zoom ratio, integrated Greenough optical system for flat focal planes, ring illuminator LED base, and 10x widefield eyepieces for biological sample dissection.',
    category: ResourceCategory.Laboratory,
    resourceType: 'Microscope',
    institutionId: 'univ-main',
    ownerId: 'faculty-bio-dept',
    location: 'Darwin Life Sciences Complex, Bio-Observation Room 410',
    quantity: 3,
    availableQuantity: 0,
    condition: 'Fair',
    images: [
      createSvgImage('Olympus SZ61', 'Laboratory Equipment', '#0284c7', '#f0f9ff'),
    ],
    specifications: {
      Magnification: '6.7x to 45x continuous optical zoom',
      WorkingDistance: '110 mm',
      Illumination: 'Adjustable dual-branch LED gooseneck + transmitted ring',
      CameraPort: 'C-mount adapter for digital imaging',
    },
    eligibilityRequirements: [
      'Biosciences or Chemistry laboratory certification',
      'Mandatory pre-use lens cleaning protocol',
    ],
    availabilityStatus: 'unavailable',
    approvalRequired: true,
    createdAt: '2026-07-10T12:00:00Z',
    updatedAt: '2026-10-31T08:00:00Z',
  },
  {
    id: 'res-sports-008',
    title: 'Intercollegiate Badminton Equipment Set (Yonex)',
    description:
      'Complete tournament-grade set including four Yonex Astrox 88D Pro graphite racquets, tournament nylon shuttlecock tubes, regulation portable tension net, and protective thermal racquet bag.',
    category: ResourceCategory.Sports,
    resourceType: 'Sports Gear',
    institutionId: 'univ-main',
    ownerId: 'athletics-center-staff',
    location: 'Campus Sports & Recreation Complex, Equipment Desk Counter A',
    quantity: 5,
    availableQuantity: 5,
    condition: 'Excellent',
    images: [
      createSvgImage('Yonex Badminton Set', 'Sports Equipment', '#16a34a', '#f0fdf4'),
    ],
    specifications: {
      Racquets: '4x Yonex Astrox 88D Pro (4U/G5)',
      StringTension: 'Pre-strung with Yonex BG80 at 24 lbs',
      Shuttlecocks: '2x 6-pack Yonex Mavis 350 Yellow',
      Bag: '9-racquet thermal dual-compartment backpack',
    },
    eligibilityRequirements: [
      'Valid student athletic pass / university sports membership',
      'Same-day return before sports center closing (10:00 PM)',
    ],
    availabilityStatus: 'available',
    approvalRequired: false,
    createdAt: '2026-08-01T07:30:00Z',
    updatedAt: '2026-10-27T18:00:00Z',
  },
  {
    id: 'res-creative-009',
    title: 'Bambu Lab X1-Carbon 3D Precision Printer',
    description:
      'High-speed core-XY 3D printer featuring dual automated bed leveling, AI spaghetti failure detection, active carbon air filtration, and 4-spool Automatic Material System (AMS) for multi-color carbon-fiber prints.',
    category: ResourceCategory.Creative,
    resourceType: '3D Printer',
    institutionId: 'univ-main',
    ownerId: 'makerspace-supervisor',
    location: 'Design & Prototyping Makerspace, Rapid Prototyping Bay 1',
    quantity: 2,
    availableQuantity: 1,
    condition: 'Like New',
    images: [
      createSvgImage('Bambu X1-Carbon', 'Creative Equipment', '#9333ea', '#faf5ff'),
    ],
    specifications: {
      BuildVolume: '256 x 256 x 256 mm³',
      MaxNozzleTemp: '300 °C (Hardened Steel Nozzle)',
      MaxSpeed: '500 mm/s with 20000 mm/s² acceleration',
      SupportedMaterials: 'PLA, PETG, TPU, ABS, Carbon Fiber reinforced (PA-CF/PET-CF)',
    },
    eligibilityRequirements: [
      'Completed Makerspace 3D Printing Safety Induction',
      'Provide your own compatible 1.75mm filament spool or purchase from Makerspace stock',
    ],
    availabilityStatus: 'available',
    approvalRequired: true,
    createdAt: '2026-09-18T10:00:00Z',
    updatedAt: '2026-10-31T12:00:00Z',
  },
  {
    id: 'res-room-010',
    title: 'Collaborative Seminar & Presentation Hall 402',
    description:
      'Multi-purpose 45-seat tiered lecture hall with dual laser projection, Logitech Rally Bar video conferencing, ceiling microphone array, whiteboard walls, and motorized blinds.',
    category: ResourceCategory.Rooms,
    resourceType: 'Seminar Hall',
    institutionId: 'univ-main',
    ownerId: 'facilities-management',
    location: 'Academic Hall Block B, 4th Floor Room 402',
    quantity: 1,
    availableQuantity: 0,
    condition: 'Good',
    images: [
      createSvgImage('Seminar Hall 402', 'Rooms & Spaces', '#10b981', '#ecfdf5'),
    ],
    specifications: {
      Capacity: '45 seated attendees (tiered lecture layout)',
      Display: 'Dual 1080p 6000-lumen laser projectors',
      Audio: 'Shure Microflex Advance ceiling array + podium wireless mic',
      Conferencing: 'Native Zoom Rooms and Teams integration',
    },
    eligibilityRequirements: [
      'Recognized student organization or faculty advisor sponsor',
      'Minimum booking lead time: 48 hours in advance',
    ],
    availabilityStatus: 'reserved',
    approvalRequired: true,
    createdAt: '2026-07-22T08:00:00Z',
    updatedAt: '2026-10-30T17:40:00Z',
  },
  {
    id: 'res-other-011',
    title: 'Outdoor Event Marquee & Folding Table Set',
    description:
      'Commercial-grade 10x20 ft waterproof pop-up canopy tent with weighted leg sandbags, four 6-ft folding tables, and sixteen heavy-duty folding chairs for campus fairs and student club events.',
    category: ResourceCategory.Other,
    resourceType: 'Event Equipment',
    institutionId: 'univ-main',
    ownerId: 'student-union-facilities',
    location: 'Student Union Building, Basement Storage Room 05',
    quantity: 3,
    availableQuantity: 2,
    condition: 'Good',
    images: [
      createSvgImage('Event Canopy Set', 'Campus Equipment', '#64748b', '#f8fafc'),
    ],
    specifications: {
      CanopyDimensions: '10 x 20 ft (3m x 6m), 500D waterproof polyester',
      Tables: '4x Lifetime 6-Foot Commercial Folding Tables',
      Chairs: '16x contoured folding chairs',
      Accessories: '8x 30-lb canopy anchor sandbags',
    },
    eligibilityRequirements: [
      'Registered Student Organization executive officer sign-off',
      'Clean return condition required to avoid club suspension',
    ],
    availabilityStatus: 'available',
    approvalRequired: true,
    createdAt: '2026-08-11T13:00:00Z',
    updatedAt: '2026-10-24T15:00:00Z',
  },
];

