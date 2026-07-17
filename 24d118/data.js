/* ============================================================
   RAW SOURCE POOL
   In production, this array is what the agent's morning poll
   would assemble from space/biology/physics news APIs before
   classification and language adaptation. Here it's seeded
   so the whole pipeline can run and be inspected end to end.
   ============================================================ */

const RAW_ARTICLE_POOL = [

  // ---------------- SPACE ----------------
  {
    id: "a1",
    domain: "space",
    title: "Webb Telescope Finds Possible Water Vapor Signature on a Rocky Exoplanet",
    source: "Orbital Bulletin",
    sourceUrl: "https://example.com/webb-water-vapor-exoplanet",
    date: "2026-07-13",
    tags: ["exoplanets", "JWST", "atmospheres"],
    imageSeed: "space-exoplanet-01",
    versions: {
      beginner: `Scientists used a powerful space telescope to look at a faraway rocky planet. They think they may have found a tiny hint of water vapor in its air. It's not confirmed yet, but it's an exciting clue in the search for planets that might support life.`,
      intermediate: `A team using the James Webb Space Telescope has detected a faint chemical signature that could indicate water vapor in the atmosphere of a rocky exoplanet roughly 40 light-years away. The signal is weak, so researchers are running follow-up observations before making any firm claims. If confirmed, it would be one of the first rocky, non-gas-giant worlds with direct evidence of atmospheric water.`,
      advanced: `Spectroscopic data from Webb's NIRSpec instrument shows an absorption feature near 1.4 microns consistent with water vapor in the thin atmosphere of a terrestrial exoplanet orbiting a nearby M-dwarf star. The signal-to-noise ratio remains marginal, and the team is careful to distinguish true atmospheric absorption from stellar contamination effects common with active red dwarf hosts. Additional transit observations are scheduled to push the detection past the 5-sigma confidence threshold.`,
      expert: `Transmission spectroscopy across four transits reveals a tentative water absorption feature at 1.4 μm in the atmosphere of a terrestrial exoplanet transiting a nearby M-dwarf, though current signal-to-noise (~3.2σ) falls short of a confirmed detection. Researchers must rule out stellar contamination from unocculted starspots and faculae, a well-documented confounder for M-dwarf transmission spectra, before attributing the feature to a genuine atmosphere rather than the transit light-source effect. A dedicated JWST cycle-4 program will obtain additional transits to cross-validate with NIRISS SOSS spectra.`
    },
  },
  {
    id: "a2",
    domain: "space",
    title: "Repeating Fast Radio Burst Reveals a Strange, Predictable Rhythm",
    source: "Deep Signal Network",
    sourceUrl: "https://example.com/frb-rhythm-pattern",
    date: "2026-07-12",
    tags: ["fast radio bursts", "radio astronomy", "neutron stars"],
    imageSeed: "space-radio-burst-02",
    versions: {
      beginner: `Astronomers found a mysterious burst of radio energy from deep space that repeats on a steady schedule, like clockwork. Nobody knows exactly what causes it, but the pattern is helping scientists narrow down the possibilities.`,
      intermediate: `Researchers have identified a repeating fast radio burst that switches on and off in a regular 18-day cycle, one of the most predictable patterns seen so far. The rhythm suggests the source may be a spinning neutron star with a companion object, though the exact mechanism is still unclear. Predictable bursts like this give astronomers a rare chance to point instruments in advance.`,
      advanced: `The source, cataloged as a repeating FRB, exhibits an 18-day periodicity in its active windows, joining a small class of periodic repeaters first identified in 2020. Leading models attribute the modulation to orbital motion in a binary system, possibly a magnetar paired with a massive stellar companion whose wind periodically obscures or amplifies the burst-producing region. The predictability allows coordinated multi-wavelength campaigns timed to the active phase.`,
      expert: `VLA and CHIME follow-up confirm an 18.06-day activity periodicity in this repeating FRB source, consistent with orbital modulation models invoking a magnetar in a highly eccentric binary with a Be-type stellar companion, where periastron passage through the companion's dense wind modulates burst detectability via free-free absorption. Polarization angle swings across the active window are being compared against magnetospheric versus binary-precession models to discriminate emission geometry, with a coordinated FAST/MeerKAT campaign timed to the next predicted active phase.`
    },
  },
  {
    id: "a3",
    domain: "space",
    title: "Mars Rover Detects Organic Molecule Traces in Ancient Lakebed Rock",
    source: "Red Planet Dispatch",
    sourceUrl: "https://example.com/mars-organic-molecules",
    date: "2026-07-10",
    tags: ["Mars", "rovers", "astrobiology"],
    imageSeed: "space-mars-rover-03",
    versions: {
      beginner: `A Mars rover drilled into rock from a lake that dried up billions of years ago. Inside, it found small traces of carbon-based molecules. This doesn't prove there was life on Mars, but it's the kind of clue scientists look for.`,
      intermediate: `NASA's rover has drilled a new sample from mudstone that once sat at the bottom of an ancient Martian lake, and onboard instruments detected traces of organic molecules preserved in the rock. Organic molecules can form without life, so the finding isn't proof of biology, but it does confirm the right chemical ingredients were present in a habitable environment billions of years ago.`,
      advanced: `Analysis from the rover's SAM (Sample Analysis at Mars) suite identified thermally-released organic compounds, including aromatic and aliphatic fragments, from lacustrine mudstone deposited roughly 3.5 billion years ago. The preservation of these molecules depends heavily on burial depth and radiation shielding, and the team notes the compounds' isotopic signatures don't yet distinguish biotic from abiotic origin, keeping the result firmly in the "habitability evidence" category rather than a biosignature claim.`,
      expert: `SAM's evolved gas analysis and derivatization GC-MS runs on the newly drilled lacustrine mudstone core yielded a suite of thermally decomposed organics, including benzene and thiophene derivatives, at concentrations exceeding prior Gale Crater detections. Carbon isotopic ratios (δ13C) are consistent with both abiotic Fischer-Tropsch-type synthesis and, less conclusively, biogenic origin; without independent chirality or isotopic fractionation markers, the team stops short of a biosignature claim and frames the result as evidence of sustained organic preservation under low-radiolysis burial conditions.`
    },
  },
  {
    id: "a4",
    domain: "space",
    title: "Black Hole Jet Caught 'Flickering' On and Off Over Just Weeks",
    source: "Orbital Bulletin",
    sourceUrl: "https://example.com/blackhole-jet-flicker",
    date: "2026-07-09",
    tags: ["black holes", "jets", "high-energy astrophysics"],
    imageSeed: "space-blackhole-04",
    versions: {
      beginner: `A giant black hole at the center of a distant galaxy shoots out a jet of energy. Usually these jets are steady, but astronomers watched this one turn on and off over just a few weeks, which is unusually fast.`,
      intermediate: `Astronomers monitoring a supermassive black hole millions of light-years away observed its energy jet brighten and fade multiple times over a span of weeks, far faster than the slow changes typically seen in these systems. The rapid flickering suggests something is disrupting the flow of material feeding the jet, possibly a clump of gas passing close to the black hole.`,
      advanced: `Multi-epoch radio and X-ray monitoring of the active galactic nucleus revealed jet luminosity variations of nearly an order of magnitude on timescales of two to three weeks, well below the viscous timescale expected from standard accretion disk models. Researchers propose that a dense clump within the accretion flow, possibly tidally disrupted debris, is intermittently choking or feeding the jet-launching region near the event horizon.`,
      expert: `Combined VLBA and Chandra monitoring cadence resolved sub-monthly flux variability (ΔL ~0.9 dex) in the AGN's relativistic jet, inconsistent with the alpha-disk viscous timescale predicted for its estimated 10^8 M☉ black hole mass. The team favors a scenario involving inhomogeneous accretion, potentially a partially disrupted clump threading magnetic flux tubes near the ISCO, over standard MAD (magnetically arrested disk) state transitions, and is now cross-correlating the radio core shift with simultaneous polarimetric data to localize the variability's origin along the jet base.`
    },
  },
  {
    id: "a5",
    domain: "space",
    title: "Asteroid Sample Returns Rare Amino Acids Not Seen Before on Earth",
    source: "Deep Signal Network",
    sourceUrl: "https://example.com/asteroid-sample-amino-acids",
    date: "2026-07-07",
    tags: ["asteroids", "sample return", "astrobiology"],
    imageSeed: "space-asteroid-05",
    versions: {
      beginner: `Scientists opened a capsule of dust and rock brought back from an asteroid. Inside, they found amino acids, the building blocks of proteins, including some rare types not commonly found on Earth. This helps show how these ingredients might have arrived on our planet long ago.`,
      intermediate: `Analysis of material returned from a carbon-rich asteroid has turned up more than a dozen amino acids, several of which are rare or entirely unseen in terrestrial samples. Because the asteroid has never been exposed to Earth's biology, the find gives scientists a clean look at the raw chemical ingredients available in the early solar system, supporting the idea that similar material could have seeded early Earth.`,
      advanced: `Curated sample analysis identified 18 distinct amino acids, including several non-proteinogenic species rarely detected in terrestrial contexts, within the asteroid's carbonaceous chondrite-like material. The near-racemic distribution (close to equal left- and right-handed forms) supports an abiotic, extraterrestrial origin rather than biological or terrestrial contamination, reinforcing panspermia-adjacent models for the delivery of prebiotic chemistry to early Earth via bombardment.`,
      expert: `GC-MS and LC-MS/MS analysis of the pristine regolith sample resolved 18 amino acid species, including several β- and γ-amino acids uncommon in terrestrial proteinogenic chemistry, at abundances an order of magnitude higher than typically recovered from meteorite falls subject to terrestrial weathering. Enantiomeric ratios cluster near racemic (D/L ~ 1.0), consistent with abiotic aqueous alteration on the parent body rather than biotic synthesis, strengthening the case that carbonaceous asteroids were a significant delivery vector for prebiotic organics during the Late Heavy Bombardment.`
    },
  },

  // ---------------- BIOLOGY ----------------
  {
    id: "b1",
    domain: "biology",
    title: "Gene-Editing Therapy Restores Partial Vision in Inherited Blindness Trial",
    source: "Cellular Times",
    sourceUrl: "https://example.com/crispr-vision-trial",
    date: "2026-07-14",
    tags: ["CRISPR", "gene therapy", "vision"],
    imageSeed: "biology-crispr-01",
    versions: {
      beginner: `Doctors used a gene-editing tool to treat people born with a rare condition that slowly causes blindness. Several patients in the trial could see more light and shapes afterward. It's an early trial, but the results are promising.`,
      intermediate: `A small clinical trial used CRISPR gene editing, delivered directly into the eye, to correct a mutation responsible for an inherited form of blindness. Most participants showed measurable improvement in light sensitivity and some regained the ability to make out shapes and movement. Researchers caution the effect isn't a full cure, but it's one of the clearest signs yet that in-eye gene editing can safely improve vision.`,
      advanced: `The trial delivered an AAV-packaged CRISPR-Cas9 construct via subretinal injection to correct a CEP290 splice-site mutation underlying Leber congenital amaurosis. Of the enrolled participants, most showed statistically significant gains on full-field light sensitivity testing, with a subset achieving functional improvements in mobility and object recognition. Editing efficiency in photoreceptor cells, historically difficult to target in vivo, appears to be the key variable driving response magnitude.`,
      expert: `Investigators administered a dual-AAV5 CRISPR-Cas9 system targeting the deep intronic CEP290 c.2991+1655A>G splice mutation via subretinal delivery, restoring correct splicing in a fraction of photoreceptor and RPE cells sufficient to produce measurable functional rescue. Full-field stimulus threshold testing showed a mean improvement, with heterogeneity across participants attributed to baseline photoreceptor survival and vector transduction efficiency in the injected bleb. Long-term follow-up is now focused on durability of editing and off-target profiling via GUIDE-seq in accessible tissue.`
    },
  },
  {
    id: "b2",
    domain: "biology",
    title: "Deep-Sea Coral Survives Extreme Heat by Swapping Its Algae Partner",
    source: "Ocean Field Notes",
    sourceUrl: "https://example.com/coral-heat-symbiont-swap",
    date: "2026-07-11",
    tags: ["coral reefs", "symbiosis", "climate resilience"],
    imageSeed: "biology-coral-02",
    versions: {
      beginner: `Some corals survived a severe ocean heat wave that killed nearby reefs. Scientists found these corals swapped out their tiny algae partners for a tougher, heat-resistant type. This swap may help some reefs survive as oceans warm.`,
      intermediate: `During a recent marine heat wave, researchers found that some coral colonies survived by replacing their usual symbiotic algae with a more heat-tolerant strain, while neighboring colonies without this ability bleached and died. The discovery suggests certain corals have a built-in flexibility that could help parts of a reef persist through future warming events, though the swap seems to come at the cost of slower growth.
`,
      advanced: `Colonies that survived the marine heatwave showed a marked shift in Symbiodiniaceae community composition, with heat-sensitive Cladocopium clades replaced by more thermally tolerant Durusdinium symbionts. This symbiont shuffling correlated with reduced bleaching severity but also with a measurable decline in calcification rate, indicating a physiological trade-off between thermal resilience and reef-building capacity. The finding adds nuance to reef restoration strategies that assume symbiont flexibility is a uniformly positive trait.`,
      expert: `Amplicon sequencing of ITS2 markers across surviving versus bleached colonies revealed a significant shift in dominant Symbiodiniaceae genera, from Cladocopium to the thermally tolerant but metabolically less efficient Durusdinium trenchii, during the thermal anomaly. While symbiont shuffling reduced bleaching-associated mortality, paired calcification assays showed a 15-20% reduction in linear extension rate post-shuffle, consistent with prior evidence that Durusdinium-dominated symbioses trade translocated photosynthate efficiency for thermal buffering. This trade-off complicates assisted-symbiont-inoculation approaches proposed for reef restoration.`
    },
  },
  {
    id: "b3",
    domain: "biology",
    title: "Octopuses Show Two-Stage Sleep Cycle Strikingly Similar to Mammals",
    source: "Cellular Times",
    sourceUrl: "https://example.com/octopus-sleep-stages",
    date: "2026-07-08",
    tags: ["octopuses", "sleep science", "neuroscience"],
    imageSeed: "biology-octopus-03",
    versions: {
      beginner: `Scientists watching sleeping octopuses noticed their skin color changes in two different patterns, like two stages of sleep. One calm stage and one active stage where they twitch, similar to how humans have deep sleep and dream sleep.`,
      intermediate: `Researchers studying octopus sleep observed two distinct states: a quiet phase with pale, still skin, and an active phase marked by rapid color changes, twitching arms, and closed-eye movement. This two-stage pattern closely resembles the slow-wave and REM-like cycles seen in mammals and birds, suggesting some form of active, dream-like brain state may have evolved independently in these invertebrates.`,
      advanced: `Polysomnography-style monitoring combined with video tracking identified alternating quiescent and "active" sleep stages in octopuses, the latter marked by chromatophore pattern bursts, myoclonic twitching, and rapid eye movement analogs occurring roughly every 30-40 minutes. The cyclical structure and its neurophysiological correlates parallel mammalian NREM/REM alternation despite octopuses' highly decentralized nervous system, raising questions about whether active sleep serves a conserved memory-consolidation function across vastly different neural architectures.`,
      expert: `Simultaneous local field potential recordings from the octopus's optic and vertical lobes during the active sleep stage revealed oscillatory patterns bearing statistical similarity to mammalian REM-associated theta activity, despite the absence of a laminated cortex. Active-stage bouts, characterized by stereotyped chromatophore sequences and rapid eye saccades, recurred with an ultradian periodicity comparable to REM cycling in birds. Because cephalopod and vertebrate lineages diverged over 500 million years ago, the results are being framed as a case of convergent evolution of active sleep architecture rather than shared ancestry.`
    },
  },
  {
    id: "b4",
    domain: "biology",
    title: "Gut Microbiome Composition Linked to How Well Vaccines 'Take'",
    source: "Ocean Field Notes",
    sourceUrl: "https://example.com/microbiome-vaccine-response",
    date: "2026-07-06",
    tags: ["microbiome", "immunology", "vaccines"],
    imageSeed: "biology-microbiome-04",
    versions: {
      beginner: `A new study found that people with a more varied mix of gut bacteria tend to build stronger immunity after getting a vaccine. Researchers think certain bacteria may help "wake up" the immune system.`,
      intermediate: `A large cohort study found that participants with greater gut microbial diversity generated stronger antibody responses after vaccination, even after controlling for age and health status. Certain bacterial groups known to produce short-chain fatty acids appeared repeatedly in the strongest responders, hinting that gut bacteria may help prime immune cells before a vaccine ever arrives.`,
      advanced: `Metagenomic profiling of pre-vaccination stool samples showed that microbiome alpha-diversity and relative abundance of Faecalibacterium and other short-chain fatty acid (SCFA) producing taxa correlated positively with post-vaccination neutralizing antibody titers. The association held after adjusting for BMI, age, and prior antigen exposure, supporting a model in which SCFA-driven regulatory T-cell tone modulates the magnitude of adaptive immune priming.`,
      expert: `Shotgun metagenomic sequencing paired with immune cell phenotyping identified a significant positive association between baseline Faecalibacterium prausnitzii abundance, butyrate-producing pathway enrichment, and post-vaccination neutralizing titers, independent of covariates in multivariate regression. The proposed mechanism implicates SCFA-mediated GPR43 signaling on dendritic cells and Treg populations, consistent with prior germ-free mouse models showing blunted humoral responses that are rescued by butyrate supplementation, though causal confirmation in humans awaits a planned fecal-transplant intervention arm.`
    },
  },
  {
    id: "b5",
    domain: "biology",
    title: "Ancient DNA from Cave Sediment Points to an Unknown Human Relative",
    source: "Field Notes Quarterly",
    sourceUrl: "https://example.com/ancient-dna-cave-sediment",
    date: "2026-07-05",
    tags: ["ancient DNA", "human evolution", "paleogenomics"],
    imageSeed: "biology-cave-dna-05",
    versions: {
      beginner: `Scientists pulled ancient DNA out of cave dirt, without needing any bones or fossils. The DNA doesn't match any known group of ancient humans, hinting there may have been another related species we haven't identified yet.`,
      intermediate: `Researchers extracted ancient DNA directly from sediment layers in a cave, a technique that doesn't require actual fossils, and found genetic material that doesn't match Neanderthals, Denisovans, or modern humans. The unfamiliar genetic signature suggests an as-yet-unidentified population of ancient humans may have lived in the region, though scientists will need more samples to confirm it's a distinct group rather than a mixture of known lineages.`,
      advanced: `Sediment DNA capture and enrichment targeting mitochondrial and select nuclear loci recovered hominin genetic material from multiple stratigraphic layers, with phylogenetic placement falling outside the known Neanderthal and Denisovan clades. The divergence time estimated from mutation accumulation suggests a split predating the Neanderthal-Denisovan common ancestor, consistent with either a previously undocumented archaic lineage or substantial admixture complicating simple tree-based inference.`,
      expert: `Hybridization capture of ancient hominin mtDNA and nuclear fragments from cave sediment across four stratigraphic units yielded sequences that fail to cluster with reference Neanderthal or Denisovan genomes in maximum-likelihood phylogenies, with a coalescence-based divergence estimate placing the split prior to the ~430 kya Neanderthal-Denisovan bifurcation. The team is cautious about overinterpreting sediment-derived data given known issues with cross-contamination and incomplete lineage sorting, and is pursuing targeted nuclear SNP capture to test whether the signal reflects a genuine third archaic lineage or an admixed population.`
    },
  },

  // ---------------- PHYSICS ----------------
  {
    id: "p1",
    domain: "physics",
    title: "Fusion Reactor Sets New Record for Sustained Plasma Confinement",
    source: "Quanta Field Report",
    sourceUrl: "https://example.com/fusion-plasma-confinement-record",
    date: "2026-07-15",
    tags: ["fusion", "plasma physics", "energy"],
    imageSeed: "physics-fusion-01",
    versions: {
      beginner: `A fusion energy experiment kept its super-hot plasma stable for longer than ever before. That's a big deal because holding the plasma steady is one of the hardest parts of making fusion power actually work.`,
      intermediate: `A tokamak fusion reactor has held its plasma in a stable, high-confinement state for a record-breaking duration, roughly doubling the previous best. Longer confinement times are a key milestone on the path to a fusion reactor that produces more energy than it consumes, since the plasma needs to stay hot and stable long enough for fusion reactions to add up.`,
      advanced: `Operators achieved a new record for H-mode confinement duration in a tokamak, sustaining a stable pedestal and avoiding disruptive edge-localized modes for significantly longer than previous campaigns. The result was enabled by improved real-time control of the plasma shape and density profile, reducing the instabilities that typically terminate high-confinement operation. Researchers say the achievement narrows the gap toward Q>1 net-energy operation.`,
      expert: `The campaign extended H-mode pedestal-confined operation well past prior device records by combining real-time magnetic control with active ELM suppression via resonant magnetic perturbation coils, holding the plasma below the peeling-ballooning stability boundary throughout the discharge. Density and impurity profile control via pellet injection kept core radiation losses manageable, and the achieved confinement enhancement factor (H98) approached values consistent with ITER's baseline scenario, offering an empirical data point for scaling projections toward Q>1 operation.`
    },
  },
  {
    id: "p2",
    domain: "physics",
    title: "Quantum Entanglement Verified Over Record Distance via Satellite Link",
    source: "Signal & Field",
    sourceUrl: "https://example.com/satellite-entanglement-record",
    date: "2026-07-13",
    tags: ["quantum physics", "entanglement", "satellites"],
    imageSeed: "physics-quantum-02",
    versions: {
      beginner: `Scientists used a satellite to link two entangled particles across the longest distance yet, connecting labs on opposite sides of the planet. This is an important step toward super-secure, satellite-based quantum communication.`,
      intermediate: `A satellite-based experiment successfully distributed entangled photon pairs between two ground stations separated by a record distance, extending previous benchmarks in quantum communication. The entanglement survived the trip through the atmosphere and space well enough to be verified with high statistical confidence, a key requirement for building a future quantum internet that spans continents.`,
      advanced: `Researchers used a low-Earth-orbit satellite equipped with an entangled photon-pair source to distribute polarization-entangled photons to two ground stations separated by a new record baseline, verifying entanglement via a Bell inequality violation well beyond the classical bound. Atmospheric turbulence and link loss were mitigated through adaptive optics and narrow transmission windows during satellite passes, extending the feasible range for satellite-mediated quantum key distribution.`,
      expert: `The mission distributed polarization-entangled photon pairs from an onboard SPDC source to two geographically separated ground stations, achieving a Bell-CHSH parameter significantly exceeding the classical limit of 2 despite cumulative channel loss from double-downlink attenuation and atmospheric turbulence. Adaptive optics correction and narrow-band spectral filtering suppressed background counts sufficiently to maintain entanglement visibility above the threshold required for device-independent QKD protocols, extending the practical range envelope for a future satellite-relayed quantum network.`
    },
  },
  {
    id: "p3",
    domain: "physics",
    title: "Particle Collider Data Hints at Anomaly in Muon Decay Rates",
    source: "Quanta Field Report",
    sourceUrl: "https://example.com/collider-muon-decay-anomaly",
    date: "2026-07-11",
    tags: ["particle physics", "standard model", "colliders"],
    imageSeed: "physics-collider-03",
    versions: {
      beginner: `Physicists noticed that tiny particles called muons are decaying slightly differently than the standard rules of physics predict. It's a small difference, but if it holds up, it could point to new physics we don't yet understand.`,
      intermediate: `New collider data shows muon decay rates deviating slightly from Standard Model predictions, continuing a pattern of small anomalies seen in earlier experiments. The deviation isn't yet large enough to claim a discovery, but combined with previous results, it's strengthening interest in the possibility of undiscovered particles or forces influencing the decay.`,
      advanced: `The latest dataset shows a deviation of roughly 3 standard deviations from Standard Model predictions in a specific muon decay branching ratio, adding to a growing body of "flavor anomaly" measurements from other experiments. While individually inconclusive, the consistency of the deviation's direction across independent detectors is prompting renewed theoretical interest in models involving leptoquarks or additional heavy gauge bosons.`,
      expert: `Analysis of the full dataset yields a 3.1σ deviation in the branching ratio measurement relative to Standard Model expectations, computed using next-to-leading-order QCD corrections and updated lattice form factors. Combined with previously reported tensions in related flavor-changing neutral current channels, the global significance across experiments approaches a level that has revived interest in leptoquark and Z' extensions of the Standard Model, though systematic uncertainties tied to hadronic form factor modeling remain the dominant limiting factor before any discovery claim is warranted.`
    },
  },
  {
    id: "p4",
    domain: "physics",
    title: "Researchers Create a Stable Time Crystal Inside a Quantum Computing Chip",
    source: "Signal & Field",
    sourceUrl: "https://example.com/time-crystal-quantum-chip",
    date: "2026-07-09",
    tags: ["time crystals", "quantum computing", "condensed matter"],
    imageSeed: "physics-timecrystal-04",
    versions: {
      beginner: `Scientists built a strange state of matter called a "time crystal" inside a quantum computer chip. Unlike a normal crystal that repeats in space, this one repeats in time, cycling in a pattern that doesn't wear down, at least for now.`,
      intermediate: `Physicists have created a time crystal, a phase of matter whose structure repeats periodically in time rather than in space, using the qubits of a quantum computing chip. The pattern remained stable for far longer than expected, resisting the disorder that usually breaks such delicate quantum states. Time crystals are of interest partly because their inherent stability could help protect quantum information from errors.`,
      advanced: `Using a superconducting qubit array, researchers engineered a discrete time crystal by applying a periodically driven Floquet protocol combined with disorder-induced many-body localization to prevent heating. The resulting subharmonic oscillation persisted for hundreds of drive cycles, well beyond the coherence time of individual qubits, demonstrating that the collective, symmetry-broken phase is more robust to noise than any single qubit's native coherence.`,
      expert: `The team implemented a Floquet-driven discrete time crystal on a 32-qubit superconducting processor, combining a period-doubling drive with programmed disorder to induce many-body localization and suppress Floquet heating. Subharmonic response at half the drive frequency persisted across several hundred cycles, with the phase's rigidity confirmed via cross-correlated observable measurements robust to a range of drive-parameter perturbations, an experimental signature distinguishing genuine DTC order from a merely synchronized, non-topological oscillation.`
    },
  },
  {
    id: "p5",
    domain: "physics",
    title: "Gravitational Wave Detector Spots Merger of Two 'Mass-Gap' Objects",
    source: "Field Notes Quarterly",
    sourceUrl: "https://example.com/gravitational-wave-mass-gap-merger",
    date: "2026-07-06",
    tags: ["gravitational waves", "black holes", "neutron stars"],
    imageSeed: "physics-gravwave-05",
    versions: {
      beginner: `Detectors picked up ripples in space from two objects crashing together, and both objects fall into a strange in-between size, too heavy to be neutron stars but too light to be typical black holes. Scientists aren't sure exactly what they are.`,
      intermediate: `Gravitational wave observatories detected a merger between two compact objects whose masses fall into the so-called "mass gap," a range too heavy for known neutron stars and too light for typical black holes. Because this gap has been mostly empty in previous detections, the event is prompting new questions about how such objects form and what they're actually made of.`,
      advanced: `The detected merger involved two compact objects with masses of approximately 2.6 and 3.1 solar masses, placing both squarely within the neutron star-black hole mass gap where few confirmed detections exist. The absence of an electromagnetic counterpart and the inferred low tidal deformability favor a black hole interpretation for at least one component, though current models can't yet rule out an exotic, ultra-massive neutron star supported by an unusual equation of state.`,
      expert: `LIGO-Virgo-KAGRA parameter estimation places the component masses at 2.6+0.3/-0.2 and 3.1+0.4/-0.3 solar masses, both within the putative lower mass gap, with tidal deformability constraints (Λ < 50) disfavoring a conventional neutron star equation of state for the primary. The lack of a coincident kilonova or gamma-ray counterpart is consistent with a BH-BH interpretation, though the analysis can't fully exclude an exotic compact object supported by strange quark matter or a stiff hybrid EOS, motivating continued multi-messenger follow-up for similar mass-gap events.`
    },
  },
];

const READ_TIME_BY_LEVEL = {
  beginner: "2 min read",
  intermediate: "3 min read",
  advanced: "5 min read",
  expert: "7 min read",
};

const DOMAIN_META = {
  space:    { label: "Space",    accent: "#8A9EFF", glyph: "✦" },
  biology:  { label: "Biology",  accent: "#8FAE8B", glyph: "◈" },
  physics:  { label: "Physics",  accent: "#E8B84B", glyph: "▲" },
};

const READING_LEVELS = ["beginner", "intermediate", "advanced", "expert"];
