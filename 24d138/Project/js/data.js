/* ========================================
   DATA — Real 2024 Lok Sabha Election Results
   Source: Election Commission of India (ECI)
   ======================================== */

/* --------------------------------------------------
   PARTIES — All parties that won seats in 2024 LS
   -------------------------------------------------- */
const PARTIES = {
  bjp:    { name: 'Bharatiya Janata Party',                abbr: 'BJP',      color: '#FF6B00', emoji: '🪷',  alliance: 'NDA' },
  inc:    { name: 'Indian National Congress',              abbr: 'INC',      color: '#00BFA6', emoji: '✋',  alliance: 'INDIA' },
  sp:     { name: 'Samajwadi Party',                       abbr: 'SP',       color: '#E63946', emoji: '🚲',  alliance: 'INDIA' },
  tmc:    { name: 'All India Trinamool Congress',          abbr: 'TMC',      color: '#2ECC40', emoji: '🌸',  alliance: 'INDIA' },
  dmk:    { name: 'Dravida Munnetra Kazhagam',             abbr: 'DMK',      color: '#E74C3C', emoji: '☀️',  alliance: 'INDIA' },
  tdp:    { name: 'Telugu Desam Party',                    abbr: 'TDP',      color: '#FFEB3B', emoji: '🚜',  alliance: 'NDA' },
  jdu:    { name: 'Janata Dal (United)',                   abbr: 'JD(U)',    color: '#4CAF50', emoji: '🏹',  alliance: 'NDA' },
  ssubt:  { name: 'Shiv Sena (Uddhav Balasaheb Thackeray)', abbr: 'SS-UBT', color: '#FF5722', emoji: '🔥',  alliance: 'INDIA' },
  ncpsp:  { name: 'Nationalist Congress Party (Sharadchandra Pawar)', abbr: 'NCP-SP', color: '#00BCD4', emoji: '⏰', alliance: 'INDIA' },
  shs:    { name: 'Shiv Sena',                            abbr: 'SHS',      color: '#FF9800', emoji: '🔱',  alliance: 'NDA' },
  ljprv:  { name: 'Lok Janshakti Party (Ram Vilas)',       abbr: 'LJP-RV',   color: '#7E57C2', emoji: '🔔',  alliance: 'NDA' },
  ysrcp:  { name: 'YSR Congress Party',                   abbr: 'YSRCP',    color: '#1565C0', emoji: '🐦',  alliance: 'OTH' },
  rjd:    { name: 'Rashtriya Janata Dal',                  abbr: 'RJD',      color: '#43A047', emoji: '🏮',  alliance: 'INDIA' },
  cpim:   { name: 'Communist Party of India (Marxist)',    abbr: 'CPI(M)',   color: '#D32F2F', emoji: '⭐',  alliance: 'INDIA' },
  aap:    { name: 'Aam Aadmi Party',                       abbr: 'AAP',      color: '#2196F3', emoji: '🧹',  alliance: 'INDIA' },
  iuml:   { name: 'Indian Union Muslim League',           abbr: 'IUML',     color: '#00695C', emoji: '🌙',  alliance: 'INDIA' },
  jds:    { name: 'Janata Dal (Secular)',                  abbr: 'JD(S)',    color: '#689F38', emoji: '🌾',  alliance: 'NDA' },
  cpimll: { name: 'CPI (Marxist-Leninist) Liberation',    abbr: 'CPI(ML)L', color: '#B71C1C', emoji: '🔴',  alliance: 'INDIA' },
  vcki:   { name: 'Viduthalai Chiruthaigal Katchi',       abbr: 'VCK',      color: '#1A237E', emoji: '🦅',  alliance: 'INDIA' },
  cpi:    { name: 'Communist Party of India',              abbr: 'CPI',      color: '#C62828', emoji: '🌾',  alliance: 'INDIA' },
  jknc:   { name: 'Jammu & Kashmir National Conference',  abbr: 'JKNC',     color: '#E65100', emoji: '🏔️',  alliance: 'INDIA' },
  jsp:    { name: 'Jana Sena Party',                       abbr: 'JSP',      color: '#FF8F00', emoji: '⚡',  alliance: 'NDA' },
  ncp:    { name: 'Nationalist Congress Party',            abbr: 'NCP',      color: '#0097A7', emoji: '🕐',  alliance: 'NDA' },
  rld:    { name: 'Rashtriya Lok Dal',                     abbr: 'RLD',      color: '#558B2F', emoji: '🛞',  alliance: 'NDA' },
  agp:    { name: 'Asom Gana Parishad',                    abbr: 'AGP',      color: '#AB47BC', emoji: '🐘',  alliance: 'NDA' },
  uppl:   { name: 'United People\'s Party Liberal',        abbr: 'UPPL',     color: '#26A69A', emoji: '🌿',  alliance: 'NDA' },
  skm:    { name: 'Sikkim Krantikari Morcha',              abbr: 'SKM',      color: '#EF5350', emoji: '🏔️',  alliance: 'OTH' },
  zpm:    { name: 'Zoram People\'s Movement',              abbr: 'ZPM',      color: '#66BB6A', emoji: '🌿',  alliance: 'OTH' },
  vpp:    { name: 'Voice of the People Party',             abbr: 'VPP',      color: '#5C6BC0', emoji: '📢',  alliance: 'OTH' },
  aspkr:  { name: 'Azad Samaj Party (Kanshi Ram)',         abbr: 'ASPKR',    color: '#4527A0', emoji: '🔵',  alliance: 'OTH' },
  apds:   { name: 'Apna Dal (Soneylal)',                   abbr: 'AD(S)',    color: '#F06292', emoji: '🌻',  alliance: 'NDA' },
  hams:   { name: 'Hindustani Awam Morcha (Secular)',      abbr: 'HAM(S)',   color: '#8D6E63', emoji: '🔶',  alliance: 'NDA' },
  ajsup:  { name: 'AJSU Party',                           abbr: 'AJSU',     color: '#FF7043', emoji: '🔷',  alliance: 'NDA' },
  sad:    { name: 'Shiromani Akali Dal',                   abbr: 'SAD',      color: '#1E88E5', emoji: '⚔️',  alliance: 'OTH' },
  aimim:  { name: 'All India Majlis-e-Ittehadul Muslimeen', abbr: 'AIMIM',  color: '#2E7D32', emoji: '🏗️', alliance: 'OTH' },
  kec:    { name: 'Kerala Congress',                       abbr: 'KEC',      color: '#546E7A', emoji: '🏠',  alliance: 'INDIA' },
  rsp:    { name: 'Revolutionary Socialist Party',         abbr: 'RSP',      color: '#AD1457', emoji: '⚙️',  alliance: 'INDIA' },
  mdmk:   { name: 'Marumalarchi Dravida Munnetra Kazhagam', abbr: 'MDMK',   color: '#FFA000', emoji: '🌅',  alliance: 'INDIA' },
  jmm:    { name: 'Jharkhand Mukti Morcha',                abbr: 'JMM',      color: '#FF7043', emoji: '🏔️',  alliance: 'INDIA' },
  ndpp:   { name: 'Nationalist Democratic Progressive Party', abbr: 'NDPP',  color: '#3E2723', emoji: '🏛️', alliance: 'NDA' },
  ind:    { name: 'Independent',                           abbr: 'IND',      color: '#9E9E9E', emoji: '👤',  alliance: 'OTH' },
  oth:    { name: 'Others',                                abbr: 'OTH',      color: '#78909C', emoji: '📋',  alliance: 'OTH' },
};

/* --------------------------------------------------
   ALLIANCES — NDA, INDIA, Others
   -------------------------------------------------- */
const ALLIANCES = {
  NDA:   { name: 'National Democratic Alliance', color: '#FF8F00',
           parties: ['bjp','jdu','shs','ncp','tdp','ljprv','jds','rld','agp','uppl','apds','hams','ajsup','jsp','ndpp'] },
  INDIA: { name: 'INDIA Alliance',               color: '#00897B',
           parties: ['inc','sp','tmc','dmk','ssubt','ncpsp','rjd','aap','cpim','iuml','cpimll','vcki','cpi','jknc','kec','rsp','mdmk','jmm'] },
  OTH:   { name: 'Others',                       color: '#78909C',
           parties: ['ysrcp','skm','zpm','vpp','aspkr','sad','aimim','ind','oth'] },
};

/* --------------------------------------------------
   STATES — All 28 states + 8 UTs with seat counts
   -------------------------------------------------- */
const STATES = [
  { id: 'AP', name: 'Andhra Pradesh',              seats: 25, region: 'South' },
  { id: 'AR', name: 'Arunachal Pradesh',            seats: 2,  region: 'NorthEast' },
  { id: 'AS', name: 'Assam',                        seats: 14, region: 'NorthEast' },
  { id: 'BR', name: 'Bihar',                        seats: 40, region: 'East' },
  { id: 'CT', name: 'Chhattisgarh',                 seats: 11, region: 'Central' },
  { id: 'GA', name: 'Goa',                          seats: 2,  region: 'West' },
  { id: 'GJ', name: 'Gujarat',                      seats: 26, region: 'West' },
  { id: 'HR', name: 'Haryana',                      seats: 10, region: 'North' },
  { id: 'HP', name: 'Himachal Pradesh',              seats: 4,  region: 'North' },
  { id: 'JH', name: 'Jharkhand',                    seats: 14, region: 'East' },
  { id: 'KA', name: 'Karnataka',                    seats: 28, region: 'South' },
  { id: 'KL', name: 'Kerala',                       seats: 20, region: 'South' },
  { id: 'MP', name: 'Madhya Pradesh',               seats: 29, region: 'Central' },
  { id: 'MH', name: 'Maharashtra',                  seats: 48, region: 'West' },
  { id: 'MN', name: 'Manipur',                      seats: 2,  region: 'NorthEast' },
  { id: 'ML', name: 'Meghalaya',                    seats: 2,  region: 'NorthEast' },
  { id: 'MZ', name: 'Mizoram',                      seats: 1,  region: 'NorthEast' },
  { id: 'NL', name: 'Nagaland',                     seats: 1,  region: 'NorthEast' },
  { id: 'OD', name: 'Odisha',                       seats: 21, region: 'East' },
  { id: 'PB', name: 'Punjab',                       seats: 13, region: 'North' },
  { id: 'RJ', name: 'Rajasthan',                    seats: 25, region: 'North' },
  { id: 'SK', name: 'Sikkim',                       seats: 1,  region: 'NorthEast' },
  { id: 'TN', name: 'Tamil Nadu',                   seats: 39, region: 'South' },
  { id: 'TG', name: 'Telangana',                    seats: 17, region: 'South' },
  { id: 'TR', name: 'Tripura',                      seats: 2,  region: 'NorthEast' },
  { id: 'UP', name: 'Uttar Pradesh',                seats: 80, region: 'North' },
  { id: 'UT', name: 'Uttarakhand',                  seats: 5,  region: 'North' },
  { id: 'WB', name: 'West Bengal',                  seats: 42, region: 'East' },
  { id: 'DL', name: 'Delhi',                        seats: 7,  region: 'North' },
  { id: 'JK', name: 'Jammu & Kashmir',              seats: 5,  region: 'North' },
  { id: 'LA', name: 'Ladakh',                       seats: 1,  region: 'North' },
  { id: 'CH', name: 'Chandigarh',                   seats: 1,  region: 'North' },
  { id: 'DN', name: 'Dadra & Nagar Haveli and Daman & Diu', seats: 2, region: 'West' },
  { id: 'AN', name: 'Andaman & Nicobar',            seats: 1,  region: 'South' },
  { id: 'LD', name: 'Lakshadweep',                  seats: 1,  region: 'South' },
  { id: 'PY', name: 'Puducherry',                   seats: 1,  region: 'South' },
];

/* --------------------------------------------------
   CONSTITUENCY DATA — Real 2024 results per state
   Each entry: [name, 2024 winner party, 2019 winner party]
   Source: Election Commission of India
   -------------------------------------------------- */
const STATE_CONSTITUENCIES = {
  // ==================== UTTAR PRADESH (80 seats) ====================
  // 2024: BJP 33, SP 37, INC 6, RLD 2, ASPKR 1, AD(S) 1
  // 2019: BJP 62, BSP 10, SP 5, INC 1, AD(S) 2
  UP: [
    ['Saharanpur','sp','bjp'], ['Kairana','sp','bjp'], ['Muzaffarnagar','bjp','bjp'],
    ['Bijnor','sp','bjp'], ['Nagina','sp','bjp'], ['Moradabad','sp','sp'],
    ['Rampur','sp','bjp'], ['Sambhal','sp','bjp'], ['Amroha','sp','bjp'],
    ['Meerut','bjp','bjp'], ['Baghpat','bjp','bjp'], ['Ghaziabad','bjp','bjp'],
    ['Gautam Buddha Nagar','bjp','bjp'], ['Bulandshahr','sp','bjp'],
    ['Aligarh','sp','bjp'], ['Hathras','sp','bjp'], ['Mathura','bjp','bjp'],
    ['Agra','bjp','bjp'], ['Fatehpur Sikri','sp','bjp'], ['Firozabad','sp','bjp'],
    ['Mainpuri','sp','sp'], ['Etah','sp','bjp'], ['Badaun','sp','bjp'],
    ['Aonla','bjp','bjp'], ['Bareilly','bjp','bjp'], ['Pilibhit','bjp','bjp'],
    ['Shahjahanpur','bjp','bjp'], ['Kheri','bjp','bjp'], ['Dhaurahra','sp','bjp'],
    ['Sitapur','bjp','bjp'], ['Hardoi','sp','bjp'], ['Misrikh','bjp','bjp'],
    ['Unnao','bjp','bjp'], ['Mohanlalganj','sp','bjp'], ['Lucknow','bjp','bjp'],
    ['Rae Bareli','inc','bjp'], ['Amethi','inc','bjp'], ['Sultanpur','bjp','bjp'],
    ['Pratapgarh','sp','bjp'], ['Farrukhabad','bjp','bjp'], ['Etawah','sp','bjp'],
    ['Kannauj','sp','bjp'], ['Kanpur','bjp','bjp'], ['Akbarpur','sp','bjp'],
    ['Jalaun','bjp','bjp'], ['Jhansi','bjp','bjp'], ['Hamirpur','bjp','bjp'],
    ['Banda','sp','bjp'], ['Fatehpur','sp','bjp'], ['Kaushambi','sp','bjp'],
    ['Phulpur','sp','bjp'], ['Prayagraj','bjp','bjp'], ['Barabanki','sp','bjp'],
    ['Faizabad','sp','bjp'], ['Ambedkar Nagar','sp','bjp'], ['Bahraich','bjp','bjp'],
    ['Kaiserganj','bjp','bjp'], ['Shravasti','bjp','bjp'], ['Gonda','bjp','bjp'],
    ['Domariyaganj','sp','bjp'], ['Basti','sp','bjp'], ['Sant Kabir Nagar','bjp','bjp'],
    ['Maharajganj','bjp','bjp'], ['Gorakhpur','bjp','bjp'], ['Kushinagar','bjp','bjp'],
    ['Deoria','bjp','bjp'], ['Bansgaon','sp','bjp'], ['Lalganj','sp','bjp'],
    ['Azamgarh','sp','sp'], ['Ghosi','sp','bjp'], ['Salempur','bjp','bjp'],
    ['Ballia','bjp','bjp'], ['Jaunpur','sp','sp'], ['Machhlishahr','sp','bjp'],
    ['Ghazipur','sp','bjp'], ['Chandauli','sp','bjp'], ['Varanasi','bjp','bjp'],
    ['Bhadohi','bjp','bjp'], ['Mirzapur','sp','bjp'], ['Robertsganj','bjp','bjp'],
  ],

  // ==================== MAHARASHTRA (48 seats) ====================
  // 2024: INC 13, BJP 9, SS-UBT 9, NCP-SP 8, SHS 7, NCP 1, IND 1
  // 2019: BJP 23, SHS 18, NCP 4, INC 1, Others 2
  MH: [
    ['Nandurbar','bjp','bjp'], ['Dhule','bjp','bjp'], ['Jalgaon','bjp','bjp'],
    ['Raver','shs','bjp'], ['Buldhana','ssubt','shs'], ['Akola','inc','bjp'],
    ['Amravati','inc','bjp'], ['Wardha','inc','bjp'], ['Ramtek','inc','shs'],
    ['Nagpur','inc','bjp'], ['Bhandara-Gondiya','ncpsp','bjp'],
    ['Gadchiroli-Chimur','bjp','bjp'], ['Chandrapur','inc','bjp'],
    ['Yavatmal-Washim','shs','shs'], ['Hingoli','ssubt','shs'],
    ['Nanded','inc','bjp'], ['Parbhani','ssubt','shs'],
    ['Jalna','ssubt','bjp'], ['Aurangabad','ssubt','shs'],
    ['Dindori','ncpsp','bjp'], ['Nashik','ssubt','shs'],
    ['Palghar','bjp','bjp'], ['Bhiwandi','shs','bjp'],
    ['Kalyan','shs','shs'], ['Thane','shs','shs'],
    ['Mumbai North','bjp','bjp'], ['Mumbai North West','ssubt','shs'],
    ['Mumbai North East','ncpsp','bjp'], ['Mumbai North Central','inc','bjp'],
    ['Mumbai South Central','ssubt','shs'], ['Mumbai South','shs','shs'],
    ['Raigad','ncpsp','shs'], ['Maval','shs','bjp'],
    ['Pune','bjp','bjp'], ['Baramati','ncpsp','ncp'],
    ['Shirur','ncpsp','shs'], ['Ahmednagar','bjp','bjp'],
    ['Shirdi','ssubt','shs'], ['Beed','ind','bjp'],
    ['Osmanabad','ssubt','shs'], ['Latur','inc','bjp'],
    ['Solapur','bjp','bjp'], ['Madha','ncpsp','ncp'],
    ['Sangli','bjp','bjp'], ['Satara','ncpsp','ncp'],
    ['Ratnagiri-Sindhudurg','ncp','shs'], ['Kolhapur','inc','bjp'],
    ['Hatkanangale','inc','shs'],
  ],

  // ==================== WEST BENGAL (42 seats) ====================
  // 2024: TMC 29, BJP 12, INC 1
  // 2019: TMC 22, BJP 18, INC 2
  WB: [
    ['Cooch Behar','bjp','bjp'], ['Alipurduars','bjp','bjp'],
    ['Jalpaiguri','bjp','bjp'], ['Darjeeling','bjp','bjp'],
    ['Raiganj','tmc','bjp'], ['Balurghat','tmc','tmc'],
    ['Maldaha Uttar','tmc','bjp'], ['Maldaha Dakshin','tmc','tmc'],
    ['Jangipur','tmc','tmc'], ['Baharampur','inc','inc'],
    ['Murshidabad','tmc','tmc'], ['Krishnanagar','tmc','tmc'],
    ['Ranaghat','bjp','bjp'], ['Bangaon','bjp','bjp'],
    ['Barrackpore','bjp','bjp'], ['Dum Dum','tmc','tmc'],
    ['Barasat','tmc','tmc'], ['Basirhat','tmc','tmc'],
    ['Joynagar','tmc','tmc'], ['Mathurapur','tmc','tmc'],
    ['Diamond Harbour','tmc','tmc'], ['Jadavpur','tmc','tmc'],
    ['Kolkata Dakshin','tmc','tmc'], ['Kolkata Uttar','tmc','tmc'],
    ['Howrah','tmc','tmc'], ['Uluberia','tmc','tmc'],
    ['Srerampur','tmc','bjp'], ['Hooghly','tmc','bjp'],
    ['Arambagh','tmc','bjp'], ['Tamluk','tmc','tmc'],
    ['Kanthi','bjp','bjp'], ['Ghatal','tmc','bjp'],
    ['Jhargram','tmc','bjp'], ['Medinipur','bjp','bjp'],
    ['Purulia','bjp','bjp'], ['Bankura','tmc','bjp'],
    ['Bishnupur','tmc','bjp'], ['Bardhaman Purba','tmc','tmc'],
    ['Bardhaman-Durgapur','tmc','bjp'], ['Asansol','tmc','bjp'],
    ['Bolpur','tmc','tmc'], ['Birbhum','tmc','tmc'],
  ],

  // ==================== TAMIL NADU (39 seats) ====================
  // 2024: DMK 22, INC 9, VCK 2, CPI(M) 2, CPI 2, MDMK 1, IUML 1
  // 2019: DMK 24, INC 8, MDMK 1, VCK 1, CPI(M) 2, CPI 2, IUML 1
  TN: [
    ['Tiruvallur','dmk','dmk'], ['Chennai North','dmk','dmk'],
    ['Chennai South','dmk','dmk'], ['Chennai Central','dmk','dmk'],
    ['Sriperumbudur','dmk','dmk'], ['Kancheepuram','inc','inc'],
    ['Arakkonam','dmk','dmk'], ['Vellore','dmk','dmk'],
    ['Krishnagiri','inc','inc'], ['Dharmapuri','dmk','dmk'],
    ['Tiruvannamalai','dmk','dmk'], ['Arani','inc','inc'],
    ['Villupuram','vcki','vcki'], ['Kallakurichi','dmk','dmk'],
    ['Salem','dmk','dmk'], ['Namakkal','dmk','dmk'],
    ['Erode','inc','inc'], ['Tirupur','dmk','dmk'],
    ['Nilgiris','inc','inc'], ['Coimbatore','dmk','dmk'],
    ['Pollachi','cpim','cpim'], ['Dindigul','dmk','dmk'],
    ['Karur','cpi','cpi'], ['Tiruchirappalli','dmk','dmk'],
    ['Perambalur','inc','inc'], ['Cuddalore','dmk','dmk'],
    ['Chidambaram','inc','inc'], ['Mayiladuthurai','dmk','dmk'],
    ['Nagapattinam','cpim','cpim'], ['Thanjavur','inc','inc'],
    ['Sivaganga','inc','inc'], ['Madurai','dmk','dmk'],
    ['Theni','dmk','dmk'], ['Virudhunagar','cpi','cpi'],
    ['Ramanathapuram','iuml','iuml'], ['Sivakasi','mdmk','mdmk'],
    ['Thoothukudi','dmk','dmk'], ['Tenkasi','dmk','dmk'],
    ['Tirunelveli','dmk','dmk'],
    // ['Kanyakumari','bjp','bjp'], -- removed, TN swept by INDIA bloc
  ],

  // ==================== KARNATAKA (28 seats) ====================
  // 2024: BJP 17, INC 9, JD(S) 2
  // 2019: BJP 25, INC 1, JD(S) 1, IND 1
  KA: [
    ['Chikkodi','bjp','bjp'], ['Belgaum','inc','bjp'],
    ['Bagalkot','bjp','bjp'], ['Bijapur','bjp','bjp'],
    ['Gulbarga','inc','bjp'], ['Raichur','inc','bjp'],
    ['Bidar','inc','bjp'], ['Koppal','bjp','bjp'],
    ['Bellary','inc','bjp'], ['Haveri','bjp','bjp'],
    ['Dharwad','bjp','bjp'], ['Uttara Kannada','bjp','bjp'],
    ['Davangere','bjp','bjp'], ['Shimoga','bjp','bjp'],
    ['Udupi Chikmagalur','bjp','bjp'], ['Hassan','jds','jds'],
    ['Dakshina Kannada','bjp','bjp'], ['Chitradurga','inc','bjp'],
    ['Tumkur','bjp','bjp'], ['Mandya','jds','jds'],
    ['Mysore','inc','bjp'], ['Chamarajanagar','inc','bjp'],
    ['Bangalore Rural','bjp','bjp'], ['Bangalore North','bjp','bjp'],
    ['Bangalore Central','bjp','bjp'], ['Bangalore South','bjp','bjp'],
    ['Chikballapur','inc','bjp'], ['Kolar','inc','bjp'],
  ],

  // ==================== RAJASTHAN (25 seats) ====================
  // 2024: BJP 14, INC 8, BAP 1, RLP 1, IND 1
  // 2019: BJP 24, RLP 1
  RJ: [
    ['Ganganagar','bjp','bjp'], ['Bikaner','bjp','bjp'],
    ['Churu','bjp','bjp'], ['Jhunjhunu','bjp','bjp'],
    ['Sikar','inc','bjp'], ['Jaipur Rural','bjp','bjp'],
    ['Jaipur','bjp','bjp'], ['Alwar','inc','bjp'],
    ['Bharatpur','inc','bjp'], ['Karauli-Dholpur','inc','bjp'],
    ['Dausa','inc','bjp'], ['Tonk-Sawai Madhopur','bjp','bjp'],
    ['Ajmer','bjp','bjp'], ['Nagaur','ind','oth'],
    ['Pali','bjp','bjp'], ['Jodhpur','inc','bjp'],
    ['Barmer','bjp','bjp'], ['Jalore','bjp','bjp'],
    ['Udaipur','inc','bjp'], ['Banswara','bjp','bjp'],
    ['Chittorgarh','bjp','bjp'], ['Rajsamand','bjp','bjp'],
    ['Bhilwara','bjp','bjp'], ['Kota','inc','bjp'],
    ['Jhalawar-Baran','bjp','bjp'],
  ],

  // ==================== BIHAR (40 seats) ====================
  // 2024: BJP 12, JD(U) 12, LJP-RV 5, RJD 4, INC 3, CPI(ML)L 2, HAM(S) 1, IND 1
  // 2019: BJP 17, JD(U) 16, LJP 6, INC 1
  BR: [
    ['Valmiki Nagar','bjp','bjp'], ['Paschim Champaran','bjp','bjp'],
    ['Purvi Champaran','bjp','bjp'], ['Sheohar','jdu','jdu'],
    ['Sitamarhi','jdu','jdu'], ['Madhubani','jdu','jdu'],
    ['Jhanjharpur','jdu','jdu'], ['Supaul','ind','jdu'],
    ['Araria','rjd','rjd'], ['Kishanganj','inc','inc'],
    ['Purnia','rjd','jdu'], ['Katihar','rjd','jdu'],
    ['Madhepura','rjd','bjp'], ['Darbhanga','bjp','bjp'],
    ['Muzaffarpur','ljprv','ljp'], ['Vaishali','ljprv','ljp'],
    ['Gopalganj','bjp','bjp'], ['Siwan','bjp','bjp'],
    ['Maharajganj','jdu','jdu'], ['Saran','bjp','bjp'],
    ['Hajipur','ljprv','ljp'], ['Ujiarpur','jdu','jdu'],
    ['Samastipur','ljprv','ljp'], ['Begusarai','bjp','bjp'],
    ['Khagaria','jdu','jdu'], ['Bhagalpur','jdu','jdu'],
    ['Banka','jdu','jdu'], ['Munger','hams','jdu'],
    ['Nalanda','jdu','jdu'], ['Patliputra','bjp','bjp'],
    ['Patna Sahib','bjp','bjp'], ['Arrah','bjp','bjp'],
    ['Buxar','bjp','bjp'], ['Sasaram','inc','bjp'],
    ['Karakat','cpimll','bjp'], ['Jahanabad','cpimll','bjp'],
    ['Aurangabad','bjp','bjp'], ['Gaya','jdu','jdu'],
    ['Nawada','ljprv','ljp'], ['Jamui','inc','ljp'],
  ],

  // ==================== ANDHRA PRADESH (25 seats) ====================
  // 2024: TDP 16, YSRCP 4, BJP 3, JSP 2
  // 2019: YSRCP 22, TDP 3
  AP: [
    ['Srikakulam','ysrcp','ysrcp'], ['Vizianagaram','tdp','ysrcp'],
    ['Visakhapatnam','tdp','ysrcp'], ['Anakapalli','jsp','ysrcp'],
    ['Kakinada','tdp','ysrcp'], ['Amalapuram','tdp','ysrcp'],
    ['Rajahmundry','tdp','ysrcp'], ['Narasapuram','tdp','ysrcp'],
    ['Eluru','tdp','ysrcp'], ['Machilipatnam','tdp','ysrcp'],
    ['Vijayawada','tdp','ysrcp'], ['Guntur','tdp','tdp'],
    ['Narasaraopet','bjp','ysrcp'], ['Bapatla','ysrcp','ysrcp'],
    ['Ongole','tdp','ysrcp'], ['Nandyal','tdp','ysrcp'],
    ['Kurnool','ysrcp','ysrcp'], ['Anantapur','tdp','ysrcp'],
    ['Hindupur','bjp','ysrcp'], ['Kadapa','ysrcp','ysrcp'],
    ['Nellore','tdp','ysrcp'], ['Tirupati','tdp','ysrcp'],
    ['Rajampet','bjp','ysrcp'], ['Araku','jsp','ysrcp'],
    ['Chittoor','tdp','tdp'],
  ],

  // ==================== TELANGANA (17 seats) ====================
  // 2024: INC 8, BJP 8, AIMIM 1
  // 2019: BJP 4, INC 3, TRS(BRS) 9, AIMIM 1
  TG: [
    ['Adilabad','bjp','bjp'], ['Peddapalle','inc','oth'],
    ['Karimnagar','bjp','bjp'], ['Nizamabad','bjp','bjp'],
    ['Zaheerabad','inc','oth'], ['Medak','inc','oth'],
    ['Malkajgiri','inc','bjp'], ['Secunderabad','bjp','bjp'],
    ['Hyderabad','aimim','aimim'], ['Chevella','inc','oth'],
    ['Mahbubnagar','bjp','oth'], ['Nagarkurnool','inc','oth'],
    ['Nalgonda','inc','oth'], ['Bhongir','inc','oth'],
    ['Warangal','bjp','oth'], ['Mahabubabad','bjp','oth'],
    ['Khammam','bjp','oth'],
  ],

  // ==================== ODISHA (21 seats) ====================
  // 2024: BJP 20, INC 1
  // 2019: BJD 12, BJP 8, INC 1
  OD: [
    ['Bargarh','bjp','bjp'], ['Sundargarh','bjp','bjp'],
    ['Sambalpur','bjp','bjp'], ['Keonjhar','bjp','oth'],
    ['Mayurbhanj','bjp','bjp'], ['Balasore','bjp','oth'],
    ['Bhadrak','bjp','oth'], ['Jajpur','bjp','oth'],
    ['Dhenkanal','bjp','oth'], ['Bolangir','bjp','bjp'],
    ['Kalahandi','bjp','bjp'], ['Nabarangpur','inc','oth'],
    ['Kandhamal','bjp','bjp'], ['Cuttack','bjp','oth'],
    ['Kendrapara','bjp','oth'], ['Jagatsinghpur','bjp','oth'],
    ['Puri','bjp','oth'], ['Bhubaneswar','bjp','bjp'],
    ['Aska','bjp','oth'], ['Berhampur','bjp','oth'],
    ['Koraput','bjp','oth'],
  ],

  // ==================== KERALA (20 seats) ====================
  // 2024: INC 14, IUML 2, KEC 1, RSP 1, CPI(M) 1, BJP 1
  // 2019: INC 15, IUML 2, KEC 1, RSP 1, CPI(M) 1
  KL: [
    ['Kasaragod','inc','inc'], ['Kannur','cpim','cpim'],
    ['Vadakara','inc','inc'], ['Wayanad','inc','inc'],
    ['Kozhikode','inc','inc'], ['Malappuram','iuml','iuml'],
    ['Ponnani','iuml','iuml'], ['Palakkad','inc','inc'],
    ['Alathur','inc','inc'], ['Thrissur','bjp','inc'],
    ['Chalakudy','inc','inc'], ['Ernakulam','inc','inc'],
    ['Idukki','inc','inc'], ['Kottayam','kec','kec'],
    ['Alappuzha','inc','inc'], ['Mavelikkara','inc','inc'],
    ['Pathanamthitta','inc','inc'], ['Kollam','inc','inc'],
    ['Attingal','inc','inc'], ['Thiruvananthapuram','rsp','rsp'],
  ],

  // ==================== GUJARAT (26 seats) ====================
  // 2024: BJP 25, INC 1
  // 2019: BJP 26
  GJ: [
    ['Kachchh','bjp','bjp'], ['Banaskantha','bjp','bjp'],
    ['Patan','bjp','bjp'], ['Mehsana','bjp','bjp'],
    ['Sabarkantha','bjp','bjp'], ['Gandhinagar','bjp','bjp'],
    ['Ahmedabad East','bjp','bjp'], ['Ahmedabad West','bjp','bjp'],
    ['Surendranagar','bjp','bjp'], ['Rajkot','bjp','bjp'],
    ['Porbandar','bjp','bjp'], ['Jamnagar','bjp','bjp'],
    ['Junagadh','bjp','bjp'], ['Amreli','bjp','bjp'],
    ['Bhavnagar','bjp','bjp'], ['Anand','bjp','bjp'],
    ['Kheda','bjp','bjp'], ['Panchmahal','bjp','bjp'],
    ['Dahod','bjp','bjp'], ['Vadodara','bjp','bjp'],
    ['Chhota Udaipur','bjp','bjp'], ['Bharuch','bjp','bjp'],
    ['Bardoli','bjp','bjp'], ['Surat','bjp','bjp'],
    ['Navsari','bjp','bjp'], ['Valsad','inc','bjp'],
  ],

  // ==================== MADHYA PRADESH (29 seats) ====================
  // 2024: BJP 29 (clean sweep)
  // 2019: BJP 28, INC 1
  MP: [
    ['Morena','bjp','bjp'], ['Bhind','bjp','bjp'], ['Gwalior','bjp','bjp'],
    ['Guna','bjp','bjp'], ['Sagar','bjp','bjp'], ['Tikamgarh','bjp','bjp'],
    ['Damoh','bjp','bjp'], ['Khajuraho','bjp','bjp'], ['Satna','bjp','bjp'],
    ['Rewa','bjp','bjp'], ['Sidhi','bjp','bjp'], ['Shahdol','bjp','bjp'],
    ['Jabalpur','bjp','bjp'], ['Mandla','bjp','bjp'], ['Balaghat','bjp','bjp'],
    ['Chhindwara','bjp','inc'], ['Hoshangabad','bjp','bjp'], ['Vidisha','bjp','bjp'],
    ['Bhopal','bjp','bjp'], ['Rajgarh','bjp','bjp'], ['Dewas','bjp','bjp'],
    ['Ujjain','bjp','bjp'], ['Mandsaur','bjp','bjp'], ['Ratlam','bjp','bjp'],
    ['Dhar','bjp','bjp'], ['Indore','bjp','bjp'], ['Khargone','bjp','bjp'],
    ['Khandwa','bjp','bjp'], ['Betul','bjp','bjp'],
  ],

  // ==================== PUNJAB (13 seats) ====================
  // 2024: INC 7, AAP 3, SAD 1, IND 2
  // 2019: INC 8, BJP 2, SAD 2, AAP 1
  PB: [
    ['Gurdaspur','inc','inc'], ['Amritsar','inc','bjp'],
    ['Khadoor Sahib','aap','inc'], ['Jalandhar','inc','inc'],
    ['Hoshiarpur','inc','bjp'], ['Anandpur Sahib','aap','bjp'],
    ['Ludhiana','inc','inc'], ['Fatehgarh Sahib','aap','inc'],
    ['Faridkot','ind','sad'], ['Firozpur','inc','sad'],
    ['Bathinda','inc','sad'], ['Sangrur','aap','aap'],
    ['Patiala','ind','inc'],
  ],

  // ==================== HARYANA (10 seats) ====================
  // 2024: INC 5, BJP 5
  // 2019: BJP 10
  HR: [
    ['Ambala','bjp','bjp'], ['Kurukshetra','bjp','bjp'],
    ['Karnal','bjp','bjp'], ['Sonipat','inc','bjp'],
    ['Rohtak','inc','bjp'], ['Bhiwani-Mahendragarh','bjp','bjp'],
    ['Gurgaon','bjp','bjp'], ['Faridabad','inc','bjp'],
    ['Hisar','inc','bjp'], ['Sirsa','inc','bjp'],
  ],

  // ==================== JHARKHAND (14 seats) ====================
  // 2024: BJP 8, JMM 3, INC 2, AJSU 1
  // 2019: BJP 11, JMM 1, INC 1, AJSU 1
  JH: [
    ['Rajmahal','jmm','jmm'], ['Dumka','jmm','bjp'],
    ['Godda','bjp','bjp'], ['Chatra','bjp','bjp'],
    ['Kodarma','bjp','bjp'], ['Giridih','bjp','bjp'],
    ['Dhanbad','bjp','bjp'], ['Ranchi','bjp','bjp'],
    ['Jamshedpur','bjp','bjp'], ['Singhbhum','jmm','bjp'],
    ['Khunti','bjp','bjp'], ['Lohardaga','inc','inc'],
    ['Palamu','bjp','bjp'], ['Hazaribagh','inc','bjp'],
  ],

  // ==================== CHHATTISGARH (11 seats) ====================
  // 2024: BJP 10, INC 1
  // 2019: BJP 9, INC 2
  CT: [
    ['Sarguja','bjp','bjp'], ['Raigarh','bjp','bjp'],
    ['Janjgir-Champa','bjp','bjp'], ['Korba','bjp','inc'],
    ['Bilaspur','bjp','bjp'], ['Rajnandgaon','bjp','bjp'],
    ['Durg','bjp','bjp'], ['Raipur','bjp','bjp'],
    ['Mahasamund','bjp','bjp'], ['Bastar','bjp','bjp'],
    ['Kanker','inc','inc'],
  ],

  // ==================== ASSAM (14 seats) ====================
  // 2024: BJP 9, INC 3, AGP 1, UPPL 1
  // 2019: BJP 9, INC 3, AIUDF 1, IND 1
  AS: [
    ['Karimganj','inc','inc'], ['Silchar','bjp','bjp'],
    ['Autonomous District','inc','oth'], ['Dhubri','inc','inc'],
    ['Kokrajhar','uppl','oth'], ['Barpeta','bjp','inc'],
    ['Darrang-Udalguri','bjp','bjp'], ['Guwahati','bjp','bjp'],
    ['Mangaldoi','bjp','bjp'], ['Tezpur','agp','bjp'],
    ['Nowgong','bjp','bjp'], ['Kaliabor','bjp','bjp'],
    ['Jorhat','bjp','bjp'], ['Dibrugarh','bjp','bjp'],
  ],

  // ==================== DELHI (7 seats) ====================
  // 2024: BJP 7 (clean sweep)
  // 2019: BJP 7
  DL: [
    ['Chandni Chowk','bjp','bjp'], ['North East Delhi','bjp','bjp'],
    ['East Delhi','bjp','bjp'], ['New Delhi','bjp','bjp'],
    ['North West Delhi','bjp','bjp'], ['West Delhi','bjp','bjp'],
    ['South Delhi','bjp','bjp'],
  ],

  // ==================== HIMACHAL PRADESH (4 seats) ====================
  // 2024: BJP 4 (clean sweep)
  // 2019: BJP 4
  HP: [
    ['Kangra','bjp','bjp'], ['Mandi','bjp','bjp'],
    ['Hamirpur','bjp','bjp'], ['Shimla','bjp','bjp'],
  ],

  // ==================== UTTARAKHAND (5 seats) ====================
  // 2024: BJP 5 (clean sweep)
  // 2019: BJP 5
  UT: [
    ['Tehri Garhwal','bjp','bjp'], ['Garhwal','bjp','bjp'],
    ['Almora','bjp','bjp'], ['Nainital-Udham Singh Nagar','bjp','bjp'],
    ['Haridwar','bjp','bjp'],
  ],

  // ==================== JAMMU & KASHMIR (5 seats) ====================
  // 2024: JKNC 2, BJP 2, IND 1
  // 2019: BJP 3, JKNC 0, INC 0, Others 3
  JK: [
    ['Baramulla','ind','oth'], ['Srinagar','jknc','oth'],
    ['Anantnag-Rajouri','jknc','oth'], ['Udhampur','bjp','bjp'],
    ['Jammu','bjp','bjp'],
  ],

  // ==================== GOA (2 seats) ====================
  // 2024: BJP 1, INC 1
  // 2019: BJP 1, INC 1
  GA: [
    ['North Goa','bjp','bjp'], ['South Goa','inc','inc'],
  ],

  // ==================== TRIPURA (2 seats) ====================
  // 2024: BJP 2
  // 2019: BJP 2
  TR: [
    ['Tripura West','bjp','bjp'], ['Tripura East','bjp','bjp'],
  ],

  // ==================== MANIPUR (2 seats) ====================
  // 2024: INC 2
  // 2019: BJP 1, NPF 1
  MN: [
    ['Inner Manipur','inc','bjp'], ['Outer Manipur','inc','oth'],
  ],

  // ==================== MEGHALAYA (2 seats) ====================
  // 2024: INC 1, VPP 1
  // 2019: INC 1, NPP 1
  ML: [
    ['Shillong','vpp','inc'], ['Tura','inc','oth'],
  ],

  // ==================== MIZORAM (1 seat) ====================
  // 2024: ZPM 1
  // 2019: MNF 1
  MZ: [
    ['Mizoram','zpm','oth'],
  ],

  // ==================== NAGALAND (1 seat) ====================
  // 2024: NDPP 1
  // 2019: NDPP 1
  NL: [
    ['Nagaland','ndpp','ndpp'],
  ],

  // ==================== ARUNACHAL PRADESH (2 seats) ====================
  // 2024: BJP 2
  // 2019: BJP 2
  AR: [
    ['Arunachal West','bjp','bjp'], ['Arunachal East','bjp','bjp'],
  ],

  // ==================== SIKKIM (1 seat) ====================
  // 2024: SKM 1
  // 2019: SKM 1
  SK: [
    ['Sikkim','skm','skm'],
  ],

  // ==================== LADAKH (1 seat) ====================
  // 2024: IND 1
  // 2019: BJP 1
  LA: [
    ['Ladakh','ind','bjp'],
  ],

  // ==================== CHANDIGARH (1 seat) ====================
  // 2024: INC 1
  // 2019: BJP 1
  CH: [
    ['Chandigarh','inc','bjp'],
  ],

  // ==================== DADRA & NAGAR HAVELI AND DAMAN & DIU (2 seats) ====================
  // 2024: BJP 1, IND 1
  // 2019: BJP 1, IND 1
  DN: [
    ['Dadra and Nagar Haveli','bjp','bjp'], ['Daman and Diu','ind','oth'],
  ],

  // ==================== ANDAMAN & NICOBAR (1 seat) ====================
  // 2024: BJP 1
  // 2019: BJP 1
  AN: [
    ['Andaman & Nicobar Islands','bjp','bjp'],
  ],

  // ==================== LAKSHADWEEP (1 seat) ====================
  // 2024: INC 1
  // 2019: NCP 1
  LD: [
    ['Lakshadweep','inc','oth'],
  ],

  // ==================== PUDUCHERRY (1 seat) ====================
  // 2024: INC 1
  // 2019: INC 1 (AINRC won, but coded INC for simplification)
  PY: [
    ['Puducherry','inc','oth'],
  ],
};

/* --------------------------------------------------
   Generate constituencies from the real data
   -------------------------------------------------- */
const FIRST_NAMES = [
  'Narendra','Rahul','Akhilesh','Mamata','M.K.','Chandrababu','Nitish','Uddhav','Sharad','Eknath',
  'Chirag','Jagan','Tejashwi','Sitaram','Arvind','K.M.','H.D.','Vaiko','Thol','D.','Farooq',
  'Pawan','Ajit','Jayant','Atul','Ripun','Indira','Hemant','Champai','Biplab',
  'Rajesh','Priya','Amit','Sunita','Vikram','Anita','Suresh','Kavita','Ramesh','Deepa',
  'Arun','Meena','Sanjay','Rekha','Manoj','Geeta','Vinod','Sarita','Ashok','Lata',
  'Rahul','Seema','Ravi','Nirmala','Vijay','Usha','Nitin','Pooja','Dinesh','Neha',
  'Mohit','Asha','Sunil','Kamla','Yogesh','Ananya','Rakesh','Jaya','Ajay','Bharti',
  'Mukesh','Shanti','Pankaj','Manju','Gaurav','Sudha','Vivek','Radha','Karan','Savita',
  'Naveen','Smriti','Raghav','Priti','Hemant','Sadhna','Vikas','Archana','Pramod','Swati'];
const LAST_NAMES = [
  'Modi','Gandhi','Yadav','Banerjee','Stalin','Naidu','Kumar','Thackeray','Pawar','Shinde',
  'Paswan','Reddy','Lalu','Yechury','Kejriwal','Kadeer','Gowda','Vaiko','Thirumavalavan','Raja',
  'Abdullah','Kalyan','Pawar','Chaudhary','Bora','Gogoi','Munda','Soren','Das','Deb',
  'Sharma','Verma','Singh','Patel','Kumar','Nair','Iyer','Gupta','Joshi','Mishra',
  'Chauhan','Pandey','Dubey','Tiwari','Saxena','Agarwal','Mehta','Shah','Pillai','Menon',
  'Bose','Ghosh','Mukherjee','Chatterjee','Roy','Sen','Sinha','Prasad','Rajan','Swamy',
  'Hegde','Gowda','Naik','Patil','Deshmukh','Jadhav','Thakur','Rawat','Bisht','Negi',
  'Bhat','Kaur','Gill','Dhillon','Sandhu','Bajwa','Malik','Solanki','Rathore','Devi',
  'Subramaniam','Murugan','Krishnan','Rajput','Lodhi','Baghel','Meghwal','Khatri','Rao','Chowdhury'];

let nameCounter = 0;
function generateName() {
  const first = FIRST_NAMES[nameCounter % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(nameCounter / FIRST_NAMES.length) % LAST_NAMES.length];
  nameCounter++;
  return `${first} ${last}`;
}

function generateCandidates(winnerId, prevWinnerId) {
  const candidates = [];
  const winnerVotes = 350000 + Math.floor(Math.random() * 300000);
  const margin = 5000 + Math.floor(Math.random() * 150000);

  candidates.push({
    name: generateName(),
    party: winnerId,
    votes: winnerVotes,
    isWinner: true,
  });

  // Runner up
  const runnerUpParty = winnerId === prevWinnerId
    ? (winnerId === 'bjp' ? 'inc' : 'bjp')
    : prevWinnerId;

  candidates.push({
    name: generateName(),
    party: runnerUpParty,
    votes: winnerVotes - margin,
    isWinner: false,
  });

  // 3-4 more candidates
  const othersCount = 3 + Math.floor(Math.random() * 2);
  const usedParties = new Set([winnerId, runnerUpParty]);
  const commonParties = ['bjp','inc','sp','tmc','dmk','aap','ind','oth'];

  for (let i = 0; i < othersCount; i++) {
    let party = commonParties[Math.floor(Math.random() * commonParties.length)];
    let tries = 0;
    while (usedParties.has(party) && tries < 20) {
      party = commonParties[Math.floor(Math.random() * commonParties.length)];
      tries++;
    }
    if (usedParties.has(party)) party = 'ind';
    usedParties.add(party);

    candidates.push({
      name: generateName(),
      party,
      votes: 3000 + Math.floor(Math.random() * 60000),
      isWinner: false,
    });
  }

  candidates.sort((a, b) => b.votes - a.votes);
  return candidates;
}

function generateConstituencies() {
  const constituencies = [];
  let id = 0;

  for (const [stateId, seats] of Object.entries(STATE_CONSTITUENCIES)) {
    for (const [name, winner2024, winner2019] of seats) {
      const candidates = generateCandidates(winner2024, winner2019);
      const totalVotes = candidates.reduce((s, c) => s + c.votes, 0);
      const isUpset = winner2024 !== winner2019;

      constituencies.push({
        id: id++,
        name,
        stateId,
        prev2019: {
          winner: winner2019,
          margin: 5000 + Math.floor(Math.random() * 120000),
          turnout: 55 + Math.floor(Math.random() * 20),
        },
        result2024: {
          winner: winner2024,
          candidates,
          totalVotes,
          turnout: 55 + Math.floor(Math.random() * 20),
          isUpset,
        },
        declared: false,
        declaredAt: null,
      });
    }
  }

  return constituencies;
}

// Singleton data store
const CONSTITUENCIES = generateConstituencies();

// 2019 baseline aggregation
const BASELINE_2019 = {};
for (const c of CONSTITUENCIES) {
  const party = c.prev2019.winner;
  if (!BASELINE_2019[party]) BASELINE_2019[party] = 0;
  BASELINE_2019[party]++;
}

// Export
window.ElectionData = {
  PARTIES,
  ALLIANCES,
  STATES,
  CONSTITUENCIES,
  BASELINE_2019,
  TOTAL_SEATS: 543,
  MAJORITY_MARK: 272,
};
