/*
  Colloquium (N-compounds). Content pack for Essay Jar.

  HOW TO EDIT
  - Each essay has sections; each section has atoms (the points that must be in the essay).
  - P(...) = Pass atom (needed to pass).  B(...) = Boost atom (makes the answer strong).
  - P(text, keywords, source, note)
      keywords: groups separated by ";"  alternatives separated by "|".
      Every group must appear in your typed answer for the atom to auto-tick.
      Example: "pepsinogen; chief|autocatalysis"  = needs "pepsinogen" AND ("chief" or "autocatalysis").
  - Words of 4+ letters also match longer words (transaminase matches transaminases)
    and small typos. Words of 3 letters or fewer must match exactly (ATP, BH4, OTC).
  - To show your professor's drawing, put the image in /img and add  img: "img/q01.jpg"  to the essay.
  - chain: the whole essay as one logical sequence ("A → B → C"), in the order you draw and write it.
    EssayType puts the question in front of it automatically.
*/
(function () {
  "use strict";
  var P = function (s, k, src, note) { return { tier: "pass", s: s, k: k, src: src, note: note }; };
  var B = function (s, k, src, note) { return { tier: "boost", s: s, k: k, src: src, note: note }; };
  var S = function (h) { return { h: h, atoms: Array.prototype.slice.call(arguments, 1) }; };

  var AKG = "alpha ketoglutarate|ketoglutarate|oxoglutarate|akg|alpha kg|a kg";

  window.COURSE = {
    id: "c5",
    title: "Colloquium",
    subtitle: "Biochemistry: nitrogen compounds",
    examDate: "2026-11-30",
    examMinutes: 90,
    lectures: {
      L40: "Lecture 40: Protein digestion and intracellular degradation",
      L41: "Lecture 41: Transamination and oxidative deamination",
      L42: "Lecture 42: Decarboxylation and biogenic amines",
      L43: "Lecture 43: Detoxification of ammonia and the urea cycle",
      L44: "Lecture 44: Degradation of the carbon skeleton of amino acids",
      L48: "Lecture 48: Synthesis of porphyrins and porphyrias",
      L49: "Lecture 49: Porphyrin degradation, bile pigments and jaundice",
      L50: "Lecture 50: Purine nucleotides",
      L51: "Lecture 51: Pyrimidine nucleotides"
    },
    essays: [

      /* ---------------------------------------------------------------- 1 */
      {
        id: 1, lecture: "L40", day: 1,
        q: "Degradation of proteins in the stomach and intestines.",
        chain: "dietary protein → mouth: chewing only, saliva has no proteases → stomach → parietal cells make HCl using carbonic anhydrase → gastric juice falls to pH 1–1.5 → HCl denatures proteins, unfolding them so their peptide bonds are exposed, and kills bacteria → chief cells secrete pepsinogen, an inactive zymogen → HCl starts its activation by acid hydrolysis → pepsin then activates the rest itself: autocatalysis cuts off a 44-amino-acid peptide → pepsin is an endopeptidase: it cuts peptide bonds inside the chain → large peptides → acid chyme passes into the duodenum → bicarbonate from pancreatic juice and bile neutralises it to pH 6.5–7 → the pancreas secretes zymogens: trypsinogen, chymotrypsinogen, proelastase, procarboxypeptidases A and B → enterokinase from duodenal cells turns trypsinogen into trypsin → trypsin activates more trypsinogen and every other pancreatic zymogen → endopeptidases cut inside the chains, carboxypeptidases cut from the end → brush-border aminopeptidases and dipeptidases finish the last small peptides → free amino acids → absorbed into the enterocyte by Na+-dependent secondary active transport, 5 carrier systems, the same carriers as in the kidney tubules → portal blood → liver and tissues → most amino acids build new proteins → the rest lose their amino group by transamination and deamination → NH3 → urea made in the liver → excreted by the kidneys in urine → the carbon skeleton gives energy, glucose or ketone bodies",
        draw: "Stomach (parietal cells → HCl; chief cells → pepsinogen → pepsin) → duodenum (bicarbonate; pancreatic zymogens; enterokinase → trypsin → activates the rest) → brush-border peptidases → free amino acids → Na⁺ co-transport into enterocyte → N and C-skeleton fates. Swap this for your professor’s WhatsApp drawing once you add it.",
        hook: "The stomach is a nightclub with an acid bar. Parietal cells pour HCl shots, which denature every protein that walks in and kill the bacteria. The Chief brings a sealed can of Pepsi-nogen; the acid pops it open and pepsin then opens the rest itself (autocatalysis). Downstairs in the duodenum the bicarbonate bouncer sobers everyone up to pH 7. Entero-KINK flirts with trypsinogen, trypsin wakes up and drags every other zymogen onto the dance floor. The brush border sweeps up the last dipeptides, and the amino acids leave holding hands with Na⁺.",
        links: "Feeds Q3–Q4 (what happens to the absorbed amino acids).",
        sections: [
          S("Principle",
            P("Proteolytic enzymes are secreted as inactive zymogens (pro-enzymes) and activated by partial proteolysis; they hydrolyse peptide bonds.", "zymogen|proenzyme|pro enzyme", "L40 s6"),
            B("Endo- and exopeptidases with group substrate specificity.", "endopeptidase|exopeptidase|endoproteinase|exoproteinase", "L40 s6")
          ),
          S("Stomach",
            P("Parietal cells secrete HCl (carbonic anhydrase) → gastric juice pH 1–1.5.", "hcl|hydrochloric; parietal", "L40 s8"),
            P("Role of HCl: acid denaturation of proteins, protection against ingested bacteria, activation of pepsinogen.", "denatur", "L40 s8"),
            P("Chief cells secrete pepsinogen; activated first by HCl (acid hydrolysis), then by autocatalysis by pepsin, removing a 44-amino-acid peptide.", "pepsinogen; chief|autocatal", "L40 s11"),
            B("Parietal cells also make intrinsic factor (vitamin B12 absorption); mucus cells make mucins.", "intrinsic factor|b12", "L40 s8"),
            B("Gastricsin (pepsinogen C) / rennin: with Ca²⁺ converts casein to paracasein in breast-fed infants.", "casein|rennin|gastricsin|chymosin", "L40 s11")
          ),
          S("Small intestine",
            P("Bicarbonate (HCO₃⁻) from pancreas and bile neutralises the acid chyme to pH 6.5–7.", "bicarbonate|hco3; neutrali", "L40 s12"),
            P("Pancreas secretes zymogens: trypsinogen, chymotrypsinogen, proelastase, procarboxypeptidases A and B.", "trypsinogen; chymotrypsinogen|proelastase|procarboxypeptidase", "L40 s12"),
            P("Enterokinase (enteropeptidase) from duodenal cells activates trypsinogen → trypsin, followed by autocatalysis.", "enterokinase|enteropeptidase", "L40 s12"),
            P("Trypsin activates all the other pancreatic zymogens.", "trypsin; other|all|rest", "L40 s12–13"),
            P("Brush-border exopeptidases (aminopeptidase, leucine aminopeptidase) and dipeptidases finish digestion to free amino acids.", "aminopeptidase|dipeptidase", "L40 s12")
          ),
          S("Absorption",
            P("Amino acids are absorbed by Na⁺-dependent secondary active transport; ATP (Na⁺/K⁺ pump) keeps the Na⁺ gradient.", "secondary active|na dependent|sodium dependent|cotransport|co transport|symport", "L40 s15"),
            B("Five carrier groups: neutral; Pro/OH-Pro/Gly; acidic (Asp, Glu); basic (Arg, Lys, Orn, Cys); others (taurine). Same carriers in renal tubules.", "neutral; acidic|basic", "L40 s15"),
            B("γ-Glutamyl cycle: in intestine and kidney cells amino acids enter as γ-glutamyl amino acids via glutathione.", "glutamyl cycle|glutathione", "L40 s17–18")
          ),
          S("Fate",
            B("Absorbed amino acids → protein synthesis; amino group removed (transamination/deamination → urea); carbon skeleton → energy, glucose or ketone bodies.", "transamination|deamination|urea; skeleton|glucose|ketone", "L40 s20")
          )
        ]
      },

      /* ---------------------------------------------------------------- 2 */
      {
        id: 2, lecture: "L40", day: 1,
        q: "Degradation of endogenous proteins in lysosomes. Ubiquitin-proteasomal degradation.",
        chain: "body proteins are constantly made and broken down: protein turnover → about 75% of the released amino acids are reused → each protein has a half-life → key regulatory enzymes like HMG-CoA reductase and ALA synthase last only 0.5–2 hours, housekeeping enzymes over 100 hours → proteins are destroyed for quality control (misfolded, damaged, denatured) and for regulation (cell cycle, receptor endocytosis, synaptic remodelling) → two systems do it → 1. lysosomes → about 40 acid hydrolases (cathepsins B and D, nucleases, lipases) that work best at pH 5 → an H+-ATPase pump keeps the lysosome acidic → the hydrolases get mannose-6-phosphate in the Golgi, so M6P receptors send them to the lysosome → proteins get in by endocytosis, microautophagy (small bits of cytoplasm) and macroautophagy (whole organelles such as mitochondria) → 2. the ubiquitin–proteasome system → ubiquitin is a small 76-amino-acid tag → E1 activates ubiquitin using ATP → E2 carries it → E3 ligase chooses the target, so E3 gives the specificity → ubiquitin's C-terminal glycine binds a lysine of the target protein → a polyubiquitin chain forms → the 26S proteasome recognises the chain → its 19S cap removes the ubiquitin for reuse, unfolds the protein using ATP and opens the gate → the 20S core is made of α and β rings → β1, β2 and β5 cut the protein → short peptides come out, not free amino acids → those peptides are used for immune surveillance",
        draw: "Two side-by-side columns. Lysosome: H⁺-ATPase → pH 5, ~40 acid hydrolases (cathepsins), M6P sorting, entry by endocytosis / micro- / macroautophagy. Proteasome: Ub + E1 (ATP) → E2 → E3 → polyubiquitinated protein → 26S (19S cap + 20S core) → peptides + recycled Ub.",
        hook: "Ubiquitin is the kiss of death. E1 puts on the lipstick (costs ATP), E2 carries it across the room, and E3, the picky one with 500+ versions, plants it on a lysine of the protein it has chosen. Four kisses in a chain and the 26S bouncer drags the protein in: the 19S cap pulls the lipstick off (DUBs) and unzips the protein, the 20S core chops it into peptides. The lysosome is the acid-bath recycling bin at pH 5 for everything else, including whole mitochondria (macroautophagy).",
        links: "ALA synthase and HMG-CoA reductase are the short half-life examples (Q11).",
        sections: [
          S("Why proteins are degraded",
            P("Body proteins are in dynamic turnover (synthesis and degradation); ~75% of released amino acids are reused, the rest of the N forms urea.", "turnover|dynamic", "L40 s5, s21"),
            P("Susceptibility is expressed as half-life: key regulatory enzymes 0.5–2 h (HMG-CoA reductase, ALA synthase), housekeeping enzymes >100 h.", "half life|halflife", "L40 s22"),
            P("Reasons: quality control (denatured, misfolded, damaged proteins) and regulation (cell cycle, receptor endocytosis, synaptic remodelling).", "misfold|damaged|denatur|quality control", "L40 s24")
          ),
          S("Lysosomes",
            P("Lysosomes contain ~40 acid hydrolases (proteases such as cathepsins B and D, nucleases, lipases…) with optimum pH 5.", "cathepsin|acid hydrolase|hydrolase", "L40 s26"),
            P("An H⁺-ATPase pump in the membrane keeps the lumen acidic.", "atpase|proton pump|h pump", "L40 s27"),
            P("Hydrolases get mannose-6-phosphate in the Golgi and are sorted to lysosomes by M6P receptors.", "mannose|m6p", "L40 s28"),
            P("Proteins enter by endocytosis and autophagy: microautophagy (portions of cytoplasm) and macroautophagy (whole organelles).", "autophag", "L40 s31")
          ),
          S("Ubiquitin–proteasome",
            P("Ubiquitin: 76-amino-acid conserved protein; its C-terminal glycine binds the ε-amino group of a lysine in the target protein.", "ubiquitin; lysine|glycine|76", "L40 s32"),
            P("Three-enzyme cascade: E1 activating (ATP), E2 conjugating, E3 ligase (gives specificity) → polyubiquitin chain.", "e1|e2|e3|ligase", "L40 s33, s37"),
            P("26S proteasome = 20S core + 19S regulatory particle; degrades the protein to short peptides and releases intact ubiquitin for reuse.", "26s|20s|19s|proteasome", "L40 s32, s34"),
            B("19S cap: binds ubiquitinated proteins, removes ubiquitin (deubiquitinating enzymes), unfolds the substrate (ATP) and opens the 20S gate.", "19s; unfold|deubiquit|dub", "L40 s35"),
            B("20S core: α1–7 and β1–7 subunits; α control the gate, β1, β2, β5 carry the protease activity.", "beta; alpha", "L40 s34, s36"),
            B("Products are peptides, not amino acids — important for immune surveillance.", "immun|antigen", "L40 s36")
          )
        ]
      },

      /* ---------------------------------------------------------------- 3 */
      {
        id: 3, lecture: "L41", day: 2,
        q: "Transamination of amino acids. Alanine and aspartate transamination. Diagnostic role ALT and AST.",
        chain: "transamination is the main way amino acids lose their nitrogen → enzyme: transaminase (aminotransferase) → cofactor: pyridoxal phosphate (PLP, vitamin B6) → amino acid + α-ketoglutarate ⇌ α-keto acid + glutamate → PLP takes the amino group and becomes pyridoxamine phosphate, then hands it to α-ketoglutarate: a ping-pong mechanism → the reaction is reversible, so it also makes non-essential amino acids → works for every amino acid except lysine and threonine → so the nitrogen of almost all amino acids is collected as glutamate → ALT: alanine + α-ketoglutarate ⇌ pyruvate + glutamate → ALT is a liver enzyme → serum ALT rises in liver, bile duct and pancreas disease → up to 100 times in acute viral hepatitis, the key test → normal up to 23 U/l in men, 19 U/l in women → AST: aspartate + α-ketoglutarate ⇌ oxaloacetate + glutamate → AST is in heart, liver and muscle → used for myocardial infarction, also liver damage and muscle disease → two isoenzymes: cytoplasmic and mitochondrial, normally only the cytoplasmic one in blood → normal up to 18 U/l in men, 15 U/l in women → the glutamate then goes to glutamate dehydrogenase, which releases NH3 → transamination + deamination together = transdeamination",
        draw: "General reaction: AA₁ + α-keto acid₂ ⇌ α-keto acid₁ + AA₂ with PLP ⇄ PMP in the middle. Then ALT: alanine + α-KG ⇌ pyruvate + glutamate, and AST: aspartate + α-KG ⇌ oxaloacetate + glutamate, with structures.",
        hook: "ALT is the loyal liver girlfriend: when she shows up in the blood it means the liver is hurt — viral hepatitis can push her 100×. AST is the player: she’s in the heart (myocardial infarction), the muscles and the liver. Both do the same move — steal the amino group with PLP (vitamin B6) and hand it to α-ketoglutarate, which becomes glutamate. Lysine and Threonine refuse to play (‘LT is Late To transamination’).",
        links: "Same AST reaction makes aspartate for the urea cycle (Q9). Glutamate then goes to GDH (Q4).",
        sections: [
          S("Transamination",
            P("Main way to remove N from amino acids: the α-amino group passes to α-ketoglutarate → glutamate, and the amino acid becomes its α-keto acid (carbon skeleton).", AKG + "; glutamate", "L41 s2"),
            P("Enzymes: transaminases (aminotransferases); reactions are reversible; all amino acids except lysine and threonine.", "lysine; threonine", "L41 s2"),
            P("Cofactor pyridoxal phosphate (PLP, vitamin B6): PLP takes the amino group → pyridoxamine phosphate (PMP) → gives it to the keto acid (ping-pong).", "pyridoxal|plp|b6", "L41 s2–4"),
            B("Mechanism: PLP–lysine Schiff base (internal aldimine) → external aldimine with the amino acid → quinonoid → ketimine → hydrolysis.", "schiff|aldimine|ketimine", "L41 s5")
          ),
          S("ALT",
            P("ALT (GPT): alanine + α-ketoglutarate ⇌ pyruvate + glutamate.", "alt|gpt|alanine aminotransferase|alanine transaminase; pyruvate", "L41 s6"),
            P("Serum ALT rises in diseases of liver, bile ducts, pancreas and in hemolytic anemia; key test for acute (viral) hepatitis — up to 100-fold.", "hepatitis", "L41 s7"),
            B("Reference: males up to 23 U/l, females up to 19 U/l; rises around day 15 with jaundice, back to normal in 45–90 days.", "23|19", "L41 s7")
          ),
          S("AST",
            P("AST (GOT): aspartate + α-ketoglutarate ⇌ oxaloacetate + glutamate.", "ast|sgot|aspartate aminotransferase|aspartate transaminase; oxaloacetate|oaa", "L41 s6"),
            P("AST used mainly for myocardial infarction, also liver pathology (viral hepatitis, intoxication) and muscle diseases (myositis, dystrophy).", "myocardial|infarction|mi", "L41 s8"),
            B("Two isoenzymes: cytoplasmic (35%) and mitochondrial (65%); normally only the cytoplasmic one is in blood.", "isoenzyme|mitochondrial; cytoplasmic|cytosolic", "L41 s8"),
            B("Reference: males up to 18 U/l, females up to 15 U/l.", "18|15", "L41 s8")
          ),
          S("Meaning",
            B("Transamination + glutamate dehydrogenase = transdeamination, the main deamination route; the reverse makes non-essential amino acids.", "transdeamination|glutamate dehydrogenase|gdh", "L41 s14")
          )
        ]
      },

      /* ---------------------------------------------------------------- 4 */
      {
        id: 4, lecture: "L41", day: 2,
        q: "Deamination of amino acids. Types of oxidative deamination.",
        chain: "deamination removes the amino group of an amino acid as NH3 / NH4+ → two kinds: oxidative and non-oxidative → oxidative type 1, direct: amino acid oxidases in peroxisomes → L-amino acid oxidase uses FMN, D-amino acid oxidase uses FAD → amino acid → imino acid → + H2O → α-keto acid + NH4+ → irreversible, and it makes H2O2, which catalase destroys → the same kind of enzymes, MAO and DAO, deaminate amines → oxidative type 2: glutamate dehydrogenase in mitochondria → glutamate + NAD+ + H2O ⇌ α-ketoglutarate + NH3 + NADH → the most powerful deamination, and reversible → in the liver its NH3 goes to the urea cycle; in other tissues GDH runs backwards and fixes NH3 → GDH is allosteric: ADP and GDP switch it on when energy is low, ATP and GTP switch it off → oxidative type 3, indirect: transdeamination → a transaminase moves the amino group onto α-ketoglutarate, making glutamate → GDH then releases it as NH3 → the main route for most L-amino acids → run backwards, it makes non-essential amino acids → non-oxidative deamination needs PLP → serine dehydratase → pyruvate → threonine dehydratase → α-ketobutyrate → cysteine desulfhydrase → pyruvate + H2S → histidase → urocanate → glutaminase and asparaginase remove amide nitrogen by hydrolysis",
        draw: "Tree: Deamination → Oxidative [direct: L-AAO (FMN) / D-AAO (FAD), peroxisomes, H₂O₂ → catalase; glutamate dehydrogenase; indirect = transdeamination] and Non-oxidative [Ser, Thr, Cys, His]. Plus the GDH reaction: glutamate + NAD⁺ + H₂O ⇌ α-KG + NH₃ + NADH.",
        hook: "GDH is the energy-sensitive doorman of the mitochondria. When the cell is broke (ADP, GDP high) he opens the door: glutamate is burned, NH₃ comes out and α-KG feeds the Krebs cycle. When the cell is rich (ATP, GTP) he locks up. The amino-acid oxidases are the messy cousins in the peroxisome — they make H₂O₂ and catalase has to clean up after them.",
        links: "GDH is also how ammonia is fixed outside the liver (Q8) and how NH₃ drains α-KG in the brain (Q7).",
        sections: [
          S("Overview",
            P("Deamination releases the amino N as NH₃ / NH₄⁺; two main types: oxidative and non-oxidative.", "oxidative; non oxidative|nonoxidative", "L41 s9")
          ),
          S("Direct oxidative: amino acid oxidases",
            P("Amino acid oxidases: L-AAO (FMN) and D-AAO (FAD), flavoprotein aerobic dehydrogenases in peroxisomes.", "amino acid oxidase|aao; fmn|fad", "L41 s11"),
            P("Amino acid → α-imino acid → (+H₂O) α-keto acid + NH₄⁺; irreversible; H₂O₂ is formed and destroyed by catalase.", "catalase|h2o2|peroxide", "L41 s10–11"),
            B("Same mechanism removes amino groups of amines: monoamine oxidase (FAD, Cu²⁺) and diamine oxidase.", "monoamine oxidase|mao|diamine oxidase|dao", "L41 s11")
          ),
          S("Glutamate dehydrogenase",
            P("GDH (mitochondria): glutamate + NAD⁺ + H₂O ⇌ α-ketoglutarate + NH₃ + NADH; the most powerful deamination, reversible.", "glutamate dehydrogenase|gdh; nad", "L41 s12"),
            P("In the reductive direction it can use NADPH; in liver NH₃ goes on to the urea cycle, in other tissues GDH runs backwards and fixes NH₃ into glutamate.", "nadph|reductive", "L41 s12–13"),
            P("GDH is allosteric (6 subunits): activated by ADP and GDP, inhibited by ATP and GTP, suppressed by glucocorticoids.", "adp|gdp; atp|gtp", "L41 s12")
          ),
          S("Indirect oxidative: transdeamination",
            P("Transdeamination (predeamination) = transaminase (amino acid → glutamate) coupled with GDH (glutamate → NH₃); the main route for L-amino acids.", "transdeamination|predeamination|indirect", "L41 s14"),
            P("It is reversible: the reverse direction synthesises non-essential amino acids.", "reversible; non essential|unessential|synthesis", "L41 s14")
          ),
          S("Non-oxidative deamination",
            P("Direct non-oxidative (lyase reactions, PLP): serine dehydratase → pyruvate; threonine dehydratase → α-ketobutyrate; cysteine desulfhydrase → pyruvate + H₂S; histidase → urocanate.", "dehydratase|desulfhydrase|histidase", "L41 s15"),
            B("Glutamine and asparagine lose amide N by hydrolytic deamidation (glutaminase, asparaginase).", "glutaminase|asparaginase|deamidation", "L43 s7")
          )
        ]
      },

      /* ---------------------------------------------------------------- 5 */
      {
        id: 5, lecture: "L42", day: 5,
        q: "Serotonin and melatonin - role and regulation of synthesis.",
        chain: "tryptophan → tryptophan hydroxylase (tryptophan-5-monooxygenase) with BH4 and O2 → 5-hydroxytryptophan → BH2 is turned back into BH4 by DHPR → aromatic L-amino acid decarboxylase with PLP removes CO2 → serotonin (5-hydroxytryptamine) → regulation: the hydroxylase is not saturated, so more tryptophan in the diet means more serotonin in the brain → made in brain, platelets, mast cells, gut nerve cells and kidney; most of it sits in platelets and the gut → roles: activating neurotransmitter in the CNS (target of antidepressants), powerful vasoconstrictor, increases secretion in the gut → broken down by MAO → at night, in the pineal gland → serotonin N-acetyltransferase adds an acetyl from acetyl-CoA → N-acetylserotonin → hydroxyindole O-methyltransferase adds a methyl from SAM → melatonin → regulation: darkness → sympathetic nerves release norepinephrine onto the pineal gland → β-adrenergic receptors → cAMP rises → N-acetyltransferase is phosphorylated and switched on → so melatonin is high at night and low in daylight → roles: inhibits release of dopamine, GABA and LH (sexual activity) → controls sleep → used as a drug for sleep disorders",
        draw: "Professor’s slide: tryptophan → (tryptophan-5-hydroxylase, BH₄ → BH₂, DHPR) 5-hydroxytryptophan → (5-HTP decarboxylase, −CO₂) serotonin → (serotonin N-acetyltransferase, acetyl-CoA) N-acetylserotonin → (O-methyltransferase HIOMT, SAM → SAH) melatonin, with indole structures.",
        hook: "Tryptophan has a day job and a night job. By day: Hydroxylase gives him an OH using BH₄, Decarboxylase takes his CO₂ jacket — he’s Serotonin, the happy, vasoconstricting daytime guy living in platelets and the gut. At night, noradrenaline from the sympathetic nerves hits the pineal β-receptors, cAMP wakes the Acetyl bartender (N-acetyltransferase), and SAM the Methyl Man finishes the job: Melatonin, who switches off everyone else (dopamine, GABA, LH) and sends you to sleep.",
        links: "BH₄ cofactor shared with PAH (Q10) and tyrosine hydroxylase (Q6). Degraded by MAO (Q4).",
        sections: [
          S("Synthesis of serotonin",
            P("Step 1: tryptophan → 5-hydroxytryptophan by tryptophan hydroxylase (tryptophan-5-monooxygenase), BH₄-dependent; BH₂ regenerated by DHPR.", "tryptophan hydroxylase|tryptophan 5 hydroxylase|tryptophan 5 monooxygenase; bh4|tetrahydrobiopterin|biopterin", "L42 s12–13"),
            P("Step 2: 5-hydroxytryptophan → serotonin (5-hydroxytryptamine) by aromatic L-amino acid decarboxylase (PLP), releasing CO₂.", "decarboxylase", "L42 s2, s13"),
            P("Regulation: the hydroxylase is not saturated, so more dietary tryptophan → more brain serotonin.", "saturat|diet", "L42 s15")
          ),
          S("Role of serotonin",
            P("Made in brain, platelets, mast cells, nerve cells of GIT, kidney; highest concentration in platelets and GIT.", "platelet", "L42 s13, s15"),
            P("Activating neurotransmitter in the CNS (target of antidepressants), powerful vasoconstrictor, increases GI secretion.", "vasoconstrict; neurotransmit|antidepress", "L42 s13"),
            B("Inactivated by monoamine oxidase (MAO).", "mao|monoamine oxidase", "L42 s2")
          ),
          S("Synthesis of melatonin",
            P("Serotonin → N-acetylserotonin (serotonin N-acetyltransferase, acetyl-CoA) → melatonin (hydroxyindole O-methyltransferase, SAM).", "acetyltransferase|n acetylserotonin; sam|methyltransferase|hiomt|adenosylmethionine", "L42 s12"),
            P("Made in the pineal gland (also retina, bone marrow cells, lymphocytes).", "pineal", "L42 s16")
          ),
          S("Regulation and role of melatonin",
            P("Synthesis rises in the dark and stays low in daylight.", "dark|night", "L42 s16"),
            P("Mechanism: norepinephrine from postganglionic sympathetic nerves → β-adrenergic receptors in pineal → ↑ cAMP → phosphorylation and activation of N-acetyltransferase.", "camp; norepinephrine|noradrenaline|adrenergic", "L42 s16"),
            P("Role: inhibits synthesis/secretion of dopamine and GABA, inhibits LH (sexual activity); used as a drug for sleep disorders.", "sleep; lh|luteo|dopamine|gaba", "L42 s17"),
            B("Hartnup disease (tryptophan transport defect) → less tryptophan for serotonin, melatonin and niacin → pellagra-like symptoms.", "hartnup", "L44 s22")
          )
        ]
      },

      /* ---------------------------------------------------------------- 6 */
      {
        id: 6, lecture: "L42", day: 5,
        q: "Catecholamines - types and role of individual catecholamines.",
        chain: "catecholamines are dopamine, norepinephrine and epinephrine, all made from tyrosine → tyrosine → tyrosine hydroxylase with BH4 and O2, the rate-limiting step → DOPA, now with a catechol ring → DOPA decarboxylase (aromatic L-amino acid decarboxylase) with PLP removes CO2 → dopamine → dopamine β-hydroxylase with O2 (needs vitamin C and Cu2+) → norepinephrine → phenylethanolamine N-methyltransferase (PNMT) adds a methyl from SAM → epinephrine → stored in vesicles bound to ATP and chromogranin A → roles → dopamine: neurotransmitter of the substantia nigra in the brain → norepinephrine: the main neurotransmitter of sympathetic postganglionic endings → epinephrine: stored in the same terminals but is not the mediator there; it acts as the hormone of the adrenal medulla → breakdown by MAO, which is in nerve endings, and COMT, which is not → dopamine ends as homovanillic acid (HVA) → norepinephrine and epinephrine end as vanillylmandelic acid (VMA) → clinical: Parkinson's disease → dopamine neurons of the substantia nigra die → tremor, rigidity, slow movement, later dementia → dopamine cannot cross the blood-brain barrier but L-DOPA can → give L-DOPA with carbidopa → carbidopa blocks DOPA decarboxylase only outside the brain, so L-DOPA is not wasted in the periphery",
        draw: "Professor’s slide: tyrosine → (tyrosine hydroxylase, BH₄ + O₂) DOPA → (DOPA decarboxylase, −CO₂) dopamine → (dopamine β-hydroxylase, O₂) norepinephrine → (phenylethanolamine N-methyltransferase, SAM → SAH) epinephrine, with catechol structures.",
        hook: "Tyrosine’s glow-up in four steps. Hydroxylase gives her a second OH — now she’s DOPA with a catechol ring. Decarboxylase strips her CO₂ — Dopamine, the brain’s reward DJ. β-Hydroxylase adds one more OH — Norepinephrine, the sympathetic nerve messenger. Then SAM the Methyl Man puts a ring on it (PNMT) — Epinephrine. Parkinson’s: the substantia nigra club lost its dopamine DJs. Dopamine can’t get past the BBB bouncer, but L-DOPA can; carbidopa stops L-DOPA being wasted outside the club.",
        links: "BH₄ like PAH (Q10) and tryptophan hydroxylase (Q5). Norepinephrine switches on melatonin synthesis (Q5).",
        sections: [
          S("Types and synthesis",
            P("Catecholamines = dopamine, norepinephrine, epinephrine, made from tyrosine.", "dopamine; norepinephrine|noradrenaline; epinephrine|adrenaline", "L42 s20"),
            P("Tyrosine → DOPA by tyrosine hydroxylase (BH₄ + O₂ → BH₂ + H₂O).", "tyrosine hydroxylase; bh4|tetrahydrobiopterin|biopterin", "L42 s21"),
            P("DOPA → dopamine by DOPA decarboxylase (aromatic L-amino acid decarboxylase, PLP), releasing CO₂.", "dopa decarboxylase|aromatic", "L42 s21"),
            P("Dopamine → norepinephrine by dopamine β-hydroxylase (O₂).", "dopamine beta hydroxylase|dopamine hydroxylase|beta hydroxylase", "L42 s21"),
            P("Norepinephrine → epinephrine by phenylethanolamine N-methyltransferase (PNMT), SAM → S-adenosylhomocysteine.", "pnmt|phenylethanolamine; sam|adenosylmethionine", "L42 s21"),
            B("Tyrosine hydroxylase is the rate-limiting step; dopamine β-hydroxylase needs vitamin C and Cu²⁺.", "rate limiting|ascorbate|vitamin c", "textbook", "Not on her slides. Add only if you have time.")
          ),
          S("Roles of each",
            P("Dopamine: neurotransmitter of the substantia nigra (CNS).", "substantia nigra|nigra", "L42 s25"),
            P("Norepinephrine: principal neurotransmitter of sympathetic postganglionic endings.", "postganglionic|sympathetic", "L42 s20"),
            P("Epinephrine: stored with norepinephrine in the same nerve terminals but is not the mediator at postganglionic sympathetic endings.", "not|stored", "L42 s20"),
            B("Stored in granulated vesicles bound to ATP and chromogranin A.", "chromogranin|vesicle", "L42 s22")
          ),
          S("Degradation",
            P("Degraded by COMT (catechol-O-methyltransferase) and MAO; COMT is not in nerve endings, MAO is.", "comt|catechol o methyltransferase; mao|monoamine", "L42 s22"),
            B("End products: dopamine → homovanillic acid (HVA); norepinephrine and epinephrine → vanillylmandelic acid (VMA).", "homovanillic|hva; vanillylmandelic|vma", "L42 s23–24")
          ),
          S("Clinical: Parkinson’s disease",
            P("Parkinson’s disease: death of dopamine neurons of the substantia nigra → tremor, rigidity, slowness of movement; later dementia.", "parkinson", "L42 s25"),
            P("Therapy: L-DOPA (crosses the blood–brain barrier, dopamine does not) + carbidopa (inhibits peripheral decarboxylase, does not cross the BBB).", "l dopa|levodopa; carbidopa", "L42 s25–26")
          )
        ]
      },

      /* ---------------------------------------------------------------- 7 */
      {
        id: 7, lecture: "L43", day: 3,
        q: "Reasons for the neurotoxicity of ammonia. Endogenous sources of ammonia.",
        chain: "where ammonia comes from → glutamate dehydrogenase deaminates glutamate → amino acid oxidases deaminate L- and D-amino acids → histidine, serine and threonine are deaminated non-oxidatively → glutaminase and asparaginase release amide nitrogen → the purine nucleotide cycle in muscle and brain → gut bacteria make NH3, which arrives in portal blood → the liver normally catches it: portal blood ammonia (about 300) is far higher than systemic blood (20–50) → liver cirrhosis plus a portacaval anastomosis lets NH3 bypass the liver → hyperammonemia → why ammonia is toxic → NH3 is a strong base, pKa 9.3, so at body pH NH4+ to NH3 is about 100 to 1 → but only uncharged NH3 crosses membranes and the blood-brain barrier → reason 1: in neurons NH3 + α-ketoglutarate → glutamate (GDH) → α-ketoglutarate is drained out of the Krebs cycle → less ATP, the brain runs out of energy → reason 2: NH3 + glutamate → glutamine (glutamine synthetase) → glutamate is used up, so less GABA can be made → less inhibition → symptoms: tremor, slurred speech, blurred vision, coma and death",
        draw: "Left: list of sources all pointing to NH₃. Right: a neuron where NH₃ crosses the BBB → NH₃ + α-KG → glutamate (GDH) → + NH₃ → glutamine (glutamine synthetase), with the Krebs cycle drained (↓ α-KG → ↓ ATP) and ↓ glutamate → ↓ GABA.",
        hook: "Ammonia is a thief that slips through the blood–brain barrier as the uncharged NH₃ (NH₄⁺ can’t). Once inside, it steals α-KG out of the brain’s Krebs engine (GDH), so ATP runs out. Then it kidnaps glutamate into glutamine, so there’s none left to make GABA. Result: shaky hands, slurred speech, blurred vision, coma. The liver is the police checkpoint on the portal vein — cirrhosis plus a portacaval shortcut lets the thief drive straight past it.",
        links: "Fixation in Q8, urea cycle in Q9. Phenylalanine causes brain damage by the same α-KG drain (Q10).",
        sections: [
          S("Endogenous sources of NH₃",
            P("Oxidative deamination of glutamate by glutamate dehydrogenase.", "glutamate dehydrogenase|gdh", "L43 s7"),
            P("Oxidative deamination of L- and D-amino acids by amino acid oxidases.", "amino acid oxidase|aao", "L43 s7"),
            P("Non-oxidative deamination of histidine, serine, threonine.", "histidine|serine|threonine", "L43 s7"),
            P("Hydrolytic deamidation of glutamine and asparagine (glutaminase, asparaginase).", "glutaminase|asparaginase|deamidation", "L43 s7"),
            P("Purine nucleotide cycle in muscle and brain (not liver).", "purine nucleotide", "L43 s7"),
            P("Bacteria in the gut release NH₃ that reaches the liver in portal blood.", "bacteria", "L43 s7, s9"),
            B("Also: monoamine/diamine oxidase degradation of amines, catabolism of pyrimidines.", "monoamine|mao|pyrimidine", "L41 s11, L51 s17")
          ),
          S("Levels and hyperammonemia",
            P("Portal blood NH₃ (~300) is far higher than systemic blood (20–50, under 1 mg/l); the liver retains most of it.", "portal", "L43 s9", "Slide prints mmol/l; physiologically these are µmol/l."),
            P("Liver cirrhosis + portacaval (portal–systemic) anastomosis → NH₃ bypasses the liver → hyperammonemia.", "cirrhosis|portacaval|anastomosis", "L43 s9")
          ),
          S("Why NH₃ is neurotoxic",
            P("NH₃ is a strong base (pKa 9.3); at physiological pH NH₄⁺ : NH₃ ≈ 100 : 1, but only NH₃ crosses membranes including the blood–brain barrier.", "blood brain barrier|bbb|membrane", "L43 s10"),
            P("NH₃ + α-ketoglutarate → glutamate (GDH) depletes α-KG → Krebs cycle in neurons slows → ATP deficiency.", AKG + "; atp|tca|krebs|citric", "L43 s10"),
            P("NH₃ + glutamate → glutamine (glutamine synthetase) depletes glutamate and therefore GABA → tremor.", "glutamine synthetase|glutamine; gaba", "L43 s10", "Her slide calls glutamate ‘suppressive’; GABA is the inhibitory one. Writing ‘glutamate, the precursor of GABA’ is safe."),
            P("Symptoms of ammonia intoxication: tremor, unclear speech, unclear vision, coma and death.", "tremor|coma", "L43 s9")
          )
        ]
      },

      /* ---------------------------------------------------------------- 8 */
      {
        id: 8, lecture: "L43", day: 3,
        q: "Fixation of ammonia in extrahepatic tissues - role of glutamate and glutamine.",
        chain: "outside the liver, NH3 has to be locked into a non-toxic form → step 1: glutamate → glutamate dehydrogenase runs backwards (reductive amination) because NH3 is high in extrahepatic mitochondria → α-ketoglutarate + NH3 + NADH → glutamate → the α-ketoglutarate comes from glucose: glucose → pyruvate → oxaloacetate → Krebs cycle → α-ketoglutarate → step 2: glutamine → glutamine synthetase adds a second NH3 using ATP → glutamate + NH3 + ATP → glutamine → mostly in the brain, also in the liver → glutamine is the main non-toxic carrier of ammonia in blood and crosses cell membranes easily → glutaminase releases the NH3 where it is needed → kidney: NH4+ is excreted in urine and neutralises acids (ammoniagenesis, acid-base balance) → liver: the NH3 goes into urea → gut: glutamine is burned for energy → glutamine also donates nitrogen for asparagine, purines, pyrimidines, CTP, GMP and amino sugars → glutamate's own roles: collects nitrogen by transamination, makes glutathione and GABA, its skeleton makes glucose → muscle has a second route: the glucose-alanine cycle → amino groups collected as glutamate → ALT moves them onto pyruvate → alanine → blood → liver → ALT gives the nitrogen to α-ketoglutarate → urea → the pyruvate becomes glucose → the glucose goes back to the muscle",
        draw: "Extrahepatic cell: NH₃ + α-KG → glutamate (GDH, reductive) → + NH₃ + ATP → glutamine (glutamine synthetase). Blood: glutamine (and alanine) → kidney (glutaminase → NH₄⁺ in urine), liver (urea), gut (fuel). Muscle loop: pyruvate + glutamate → alanine (ALT) → liver → glucose → back.",
        hook: "Glutamine is ammonia’s Uber. It picks NH₃ up in the brain and muscle (glutamine synthetase charges an ATP fare), drives it safely through the blood (non-toxic, crosses membranes easily) and drops it at three addresses: the kidney (glutaminase → NH₄⁺, peed out, and it neutralises acids), the liver (turned into urea) or the gut (eaten for energy). Alanine is the muscle’s carpool lane: it carries the N to the liver and comes back as glucose.",
        links: "GDH reaction from Q4; ALT from Q3; glutamine N donors in Q17 and Q20.",
        sections: [
          S("Glutamate",
            P("Glutamate dehydrogenase works in the reductive direction in extrahepatic mitochondria (high NH₃): α-KG + NH₃ + NAD(P)H → glutamate.", "reductive|amination; glutamate dehydrogenase|gdh", "L43 s11, L41 s13"),
            P("The α-KG needed comes from glucose oxidation: glucose → pyruvate → oxaloacetate → Krebs cycle → α-KG.", "glucose; pyruvate|oxaloacetate|krebs|citric|tca", "L43 s11"),
            B("Glutamate collects N by transamination; used for non-essential amino acids, glutathione and GABA; its carbon skeleton is glucogenic.", "glutathione|gaba|non essential|unessential", "L43 s16")
          ),
          S("Glutamine",
            P("Glutamine synthetase: glutamate + NH₃ + ATP → glutamine; in peripheral tissues, especially brain, also liver.", "glutamine synthetase", "L43 s12"),
            P("Glutamine is the main non-toxic transport form of ammonia in blood; crosses cell membranes easily.", "glutamine; transport|non toxic|nontoxic|carrier", "L43 s18"),
            P("Glutaminase releases NH₃ where needed: kidney → NH₄⁺ excretion (ammoniagenesis, acid–base balance); liver → urea; gut epithelium → oxidised for energy.", "glutaminase; kidney|ammoniagenesis|renal", "L43 s12, s15"),
            B("Glutamine is an N donor for asparagine, cytosolic carbamoyl phosphate (pyrimidines), purine ring N3 and N9, CTP, GMP and amino sugars.", "amino sugar|glucosamine|asparagine|carbamoyl|purine|pyrimidine", "L43 s18")
          ),
          S("Muscle: glucose–alanine cycle",
            P("In muscle, amino groups collected as glutamate are transferred to pyruvate by ALT → alanine → blood → liver.", "alanine; pyruvate", "L43 s14"),
            P("In the liver ALT returns the N to α-KG (→ urea); the pyruvate makes glucose that goes back to muscle.", "glucose alanine|alanine cycle|gluconeogen|urea", "L43 s14")
          )
        ]
      },

      /* ---------------------------------------------------------------- 9 */
      {
        id: 9, lecture: "L43", day: 4,
        q: "Connection of the Krebs cycle with the Ornithine (Urea) cycle - aspartate-argininosuccinate cycle.",
        chain: "the urea cycle runs in the liver, in mitochondria and cytosol → it uses NH3, CO2, aspartate and 3 ATP (4 high-energy bonds) → the carbon of urea comes from CO2, one nitrogen from NH3, the other from aspartate → mitochondria: CPS I joins CO2 + NH3 + ATP → carbamoyl phosphate → CPS I is rate-limiting and is switched on by N-acetylglutamate → ornithine transcarbamoylase: carbamoyl phosphate + ornithine → citrulline → citrulline leaves the mitochondrion in exchange for ornithine → cytosol: argininosuccinate synthase joins citrulline + aspartate, using ATP → argininosuccinate → aspartate brings the second nitrogen → argininosuccinase splits it → arginine + fumarate → arginase: arginine + H2O → urea + ornithine → ornithine goes back into the mitochondrion and the cycle turns again → the link to the Krebs cycle: the aspartate-argininosuccinate shunt → fumarate → fumarase → malate → malate dehydrogenase makes NADH → oxaloacetate → AST transaminates it with glutamate → aspartate + α-ketoglutarate → that aspartate goes back into the urea cycle → so the urea cycle gives fumarate to the Krebs cycle, and the Krebs cycle gives back aspartate → regulation: N-acetylglutamate (made from acetyl-CoA + glutamate) activates CPS I → ornithine and lysine inhibit arginase → starvation raises all the enzymes 10–20 times → a defect of any enzyme causes hyperammonemia, worst at CPS I and OTC",
        draw: "Professor’s shunt slide: mitochondrion with the Krebs cycle (fumarate → malate → oxaloacetate → aspartate via transamination with glutamate/α-KG) next to the urea cycle (carbamoyl phosphate + ornithine → citrulline → + aspartate → argininosuccinate → arginine + fumarate → urea + ornithine); fumarate and aspartate arrows cross between the two cycles.",
        hook: "The Krebs bicycle: two wheels, one chain. The urea wheel throws Fumarate to the Krebs wheel; Krebs spins it into Malate → OAA (and earns an NADH), then AST sticks glutamate’s amino group on it and throws back Aspartate — the second nitrogen of urea. N-acetylglutamate is the ignition key for CPS I; without the key, nothing moves and ammonia piles up.",
        links: "AST reaction from Q3. OTC deficiency causes orotic aciduria (Q20).",
        sections: [
          S("Urea cycle",
            P("Urea (ornithine) cycle in liver mitochondria and cytosol; uses NH₄⁺, CO₂, aspartate and 3 ATP (4 high-energy bonds); C from CO₂, one N from NH₃, the other from aspartate.", "ornithine; aspartate", "L43 s20"),
            P("CPS I (mitochondria): CO₂ + NH₃ + ATP → carbamoyl phosphate; rate-limiting, allosterically activated by N-acetylglutamate.", "cps i|cps 1|carbamoyl phosphate synthetase|carbamoyl phosphate synthase; n acetylglutamate|nag", "L43 s21"),
            P("Ornithine transcarbamoylase (mitochondria): carbamoyl phosphate + ornithine → citrulline; citrulline leaves in antiport with ornithine.", "ornithine transcarbamoylase|otc; citrulline", "L43 s21"),
            P("Argininosuccinate synthase (cytosol, ATP → AMP via citrullyl-AMP): citrulline + aspartate → argininosuccinate; aspartate brings the second N.", "argininosuccinate synthase|argininosuccinate synthetase", "L43 s21"),
            P("Argininosuccinase → arginine + fumarate; arginase → urea + ornithine, which re-enters the mitochondria.", "argininosuccinase|argininosuccinate lyase; arginase", "L43 s21")
          ),
          S("The link: aspartate–argininosuccinate shunt",
            P("Fumarate from argininosuccinase → malate (fumarase) → oxaloacetate (malate dehydrogenase, NAD⁺ → NADH).", "fumarate; malate", "L43 s26"),
            P("Oxaloacetate + glutamate → aspartate + α-KG by AST (transamination); aspartate goes back into the urea cycle.", "transamina|ast|aspartate aminotransferase", "L43 s26"),
            P("So the two cycles are coupled: the urea cycle supplies fumarate to the Krebs cycle, the Krebs cycle supplies aspartate (the 2nd urea N).", "shunt|coupled|linked|connect", "L43 s26"),
            B("The NADH from malate dehydrogenase yields ATP that partly pays for urea synthesis.", "nadh", "textbook", "Logic from the slide’s NADH arrow; not stated in words.")
          ),
          S("Regulation",
            P("N-acetylglutamate (from acetyl-CoA + glutamate by NAG synthase; destroyed by NAG hydrolase) activates CPS I.", "n acetylglutamate|nag|acetylglutamate", "L43 s27"),
            P("Arginase is inhibited by ornithine and lysine; starvation induces the enzymes 10–20-fold (more protein breakdown → more NH₃).", "starvation|fasting|lysine", "L43 s27")
          ),
          S("Clinical link",
            B("Enzyme defects → hyperammonemia, worst at CPS I and OTC; OTC deficiency is X-linked with ↑ glutamine and secondary orotic aciduria.", "hyperammonemia|orotic", "L43 s28–30")
          )
        ]
      },

      /* ---------------------------------------------------------------- 10 */
      {
        id: 10, lecture: "L44", day: 4,
        q: "Metabolic disorders in the breakdown of phenylalanine and tyrosine (diseases).",
        chain: "first the normal pathway → phenylalanine → phenylalanine hydroxylase (PAH) with O2 and BH4 → tyrosine → BH2 is recycled to BH4 by DHPR with NADH → tyrosine → tyrosine aminotransferase → p-hydroxyphenylpyruvate → p-hydroxyphenylpyruvate dioxygenase → homogentisate → homogentisate 1,2-dioxygenase → maleylacetoacetate → fumarylacetoacetate → fumarylacetoacetase → fumarate + acetoacetate → side branch: tyrosine → tyrosinase → melanin → now block each step → PAH blocked: phenylketonuria (PKU), autosomal recessive → Phe above 120 µM → Phe is transaminated instead → phenylpyruvate, phenyllactate and phenylacetate in urine → phenylacetate gives a mousy odour → excess Phe takes up the transaminases and drains α-ketoglutarate from the brain → mental retardation → treat with a low-phenylalanine diet → DHPR or BH4 synthesis blocked: the same picture (non-PKU hyperphenylalaninemia) → treat with diet + BH4 → tyrosine aminotransferase blocked: tyrosinemia type II → p-hydroxyphenylpyruvate dioxygenase low: neonatal tyrosinemia, type III → fumarylacetoacetase blocked: tyrosinemia type I (tyrosinosis) → tyrosinemias: diet low in phenylalanine and tyrosine → homogentisate dioxygenase blocked: alkaptonuria → urine turns black on standing, arthritis later in life → tyrosinase blocked: albinism → no melanin, white hair, pink skin",
        draw: "Professor’s slide 9: phenylalanine → tyrosine → p-hydroxyphenylpyruvate → homogentisate → maleylacetoacetate → fumarylacetoacetate → fumarate + acetoacetate, with ⊗ at PAH (PKU), tyrosine aminotransferase (tyrosinemia II), p-HPP dioxygenase (III), homogentisate dioxygenase (alkaptonuria), fumarylacetoacetase (I); side branch tyrosine → melanin (albinism).",
        hook: "The PKU baby smells like a mouse: phenylalanine gets stuck at the PAH tollbooth, takes the side road to phenylpyruvate, and mousy-smelling phenylacetate ends up in the nappy. The extra Phe hogs the transaminases and drains α-KG out of the baby brain. Grandpa with alkaptonuria leaves his pee on the windowsill and it turns black; his joints creak. Albino: tyrosinase called in sick, so no melanin tan. Tyrosinemia numbers: ONE is the last enzyme (FAH), TWO is the first (TAT), THREE is in the middle.",
        links: "BH₄ shared with Q5 and Q6. α-KG drain is the same mechanism as ammonia (Q7).",
        sections: [
          S("Normal pathway",
            P("Phenylalanine → tyrosine by phenylalanine hydroxylase (PAH) with O₂ and BH₄; BH₂ is regenerated by dihydropteridine reductase (DHPR, NADH).", "phenylalanine hydroxylase|pah; bh4|tetrahydrobiopterin|biopterin", "L44 s7–9"),
            P("Tyrosine → p-hydroxyphenylpyruvate (tyrosine aminotransferase) → homogentisate (p-HPP dioxygenase) → maleylacetoacetate (homogentisate 1,2-dioxygenase) → fumarylacetoacetate → fumarate + acetoacetate (fumarylacetoacetase).", "homogentisate; fumarate|acetoacetate", "L44 s9")
          ),
          S("Phenylketonuria (HPA type I)",
            P("PKU: mutation of the PAH gene, autosomal recessive; hyperphenylalaninemia = plasma Phe > 120 µM.", "pku|phenylketonuria; recessive|120", "L44 s11, s14"),
            P("Phe is transaminated to phenylpyruvate → phenyllactate and phenylacetate (+ phenylacetylglutamine); all in urine; phenylacetate gives a ‘mousy’ odour.", "phenylpyruvate|phenylacetate|phenyllactate; mousy|mouse", "L44 s10, s14"),
            P("Mental retardation: excess Phe becomes the main amino donor for aminotransferases and depletes neural tissue of α-ketoglutarate.", AKG, "L44 s12"),
            P("Symptoms: neonatal vomiting, impaired cognitive development; therapy: low-phenylalanine diet.", "low phenylalanine|low phe|diet", "L44 s12, s14"),
            P("Non-PKU hyperphenylalaninemias: DHPR deficiency (types II–III) or BH₄ synthesis defect (types IV–V) — same picture, treat with diet + BH₄.", "dhpr|dihydropteridine|dihydrobiopterin; biosynthesis|synthesis", "L44 s11, s14")
          ),
          S("Tyrosine disorders",
            P("Tyrosinemia type I (tyrosinosis): fumarylacetoacetate hydrolase; ↑ serum Tyr and fumarylacetoacetate.", "tyrosinemia|tyrosinosis; fumarylacetoacetate hydrolase|fumarylacetoacetase|fah", "L44 s15–16"),
            P("Tyrosinemia type II: tyrosine aminotransferase (liver); ↑ Tyr in serum and urine plus p-OH-phenylpyruvate, -lactate, -acetate in urine.", "tyrosine aminotransferase|tyrosine transaminase", "L44 s15–16"),
            P("Neonatal tyrosinemia (type III): low p-hydroxyphenylpyruvate dioxygenase; ↑ Tyr and ↑ Phe; low-protein diet.", "hydroxyphenylpyruvate|neonatal", "L44 s15–16"),
            B("Tyrosinemias are treated with a diet low in phenylalanine and tyrosine.", "low in phenylalanine and tyrosine|low tyrosine|low in tyrosine|tyrosine diet", "L44 s15"),
            P("Alkaptonuria: homogentisate 1,2-dioxygenase; homogentisate in urine oxidises to a dark pigment; late-developing arthritis.", "alkaptonuria; dark|black|arthritis", "L44 s15–16"),
            P("Albinism: tyrosinase (tyrosine 3-monooxygenase) defect → no melanin: white hair, pink skin.", "albinism; tyrosinase|melanin", "L44 s15")
          )
        ]
      },

      /* ---------------------------------------------------------------- 11 */
      {
        id: 11, lecture: "L48", day: 6,
        q: "Regulation of heme synthesis. Factors stimulating heme synesis.",
        chain: "heme is made from glycine + succinyl-CoA, mainly in bone marrow and liver → mitochondria: ALA synthase with PLP → δ-aminolevulinic acid (ALA) → cytosol: ALA dehydratase joins 2 ALA → porphobilinogen (PBG) → PBG deaminase joins 4 PBG → hydroxymethylbilane → uroporphyrinogen III co-synthase → uroporphyrinogen III → uroporphyrinogen decarboxylase → coproporphyrinogen III → back into the mitochondria → coproporphyrinogen oxidase → protoporphyrinogen IX → protoporphyrinogen oxidase → protoporphyrin IX → ferrochelatase inserts Fe2+ → heme → regulation → ALA synthase is the key, rate-limiting enzyme → liver form ALAS1 has a short half-life of about 1 hour; the red-cell form is ALAS2 → hemin (oxidised heme) is the feedback inhibitor, in 3 ways → 1. it represses synthesis of ALAS1 at gene level → 2. it blocks transport of ALAS1 into the mitochondria → 3. it inhibits the enzyme allosterically → ferrochelatase is also controlled: glutathione and Cu2+ activate it; lead, Mn2+ and O2 inhibit it → factors that stimulate heme synthesis → low heme removes the brake on ALAS1 → iron: when iron is high, IRPs let go of the IRE on ALAS2 mRNA, so it is translated → drugs that use up heme for cytochrome P450, like barbiturates and alcohol, induce ALAS1 → hypoxia and erythropoietin increase heme synthesis in red-cell precursors",
        draw: "Heme pathway in its compartments (slide 15/20): mitochondria: succinyl-CoA + glycine → δ-ALA (ALA synthase, PLP) | cytosol: 2 ALA → PBG (ALA dehydratase) → HMB (PBG deaminase) → uroporphyrinogen III (co-synthase) → coproporphyrinogen III (decarboxylase) | mitochondria: → protoporphyrinogen IX → protoporphyrin IX → + Fe²⁺ (ferrochelatase) → heme, with a dashed hemin ⊖ arrow back to ALA synthase.",
        hook: "Heme is a boomerang: it starts in the mitochondria, goes partying in the cytosol, and comes home to the mitochondria to marry Fe²⁺ (ferrochelatase). Once enough heme is home, hemin slams the door on ALA synthase three ways: no new enzyme made, no entry into the mitochondria, and a direct slap (allosteric). Iron is the green light for the red-cell version (ALAS2). Lead is the vandal who breaks ferrochelatase.",
        links: "Porphyrias are blocks in the same pathway (Q12). ALAS2 IRE regulation is in Q13. Short half-life idea from Q2.",
        sections: [
          S("Pathway",
            P("Heme is made from glycine + succinyl-CoA → δ-aminolevulinic acid by ALA synthase (PLP; glycine is decarboxylated), in mitochondria.", "ala synthase|aminolevulin; glycine; succinyl", "L48 s6"),
            P("Cytosol: 2 ALA → porphobilinogen (ALA dehydratase); 4 PBG → hydroxymethylbilane (PBG deaminase) → uroporphyrinogen III (co-synthase) → coproporphyrinogen III (uroporphyrinogen decarboxylase).", "porphobilinogen; uroporphyrinogen|coproporphyrinogen", "L48 s6–12"),
            P("Mitochondria: coproporphyrinogen oxidase → protoporphyrinogen IX → protoporphyrin IX (protoporphyrinogen oxidase) → + Fe²⁺ by ferrochelatase → heme.", "ferrochelatase", "L48 s12")
          ),
          S("Regulation",
            P("ALA synthase is the key, rate-limiting enzyme; hepatic ALAS1 has low concentration and a short half-life (~1 h); erythroid form is ALAS2.", "rate limiting|key|alas1|alas 1", "L48 s16"),
            P("Hemin (Fe³⁺ heme) is a feedback inhibitor of ALA synthase: represses ALAS1 synthesis (gene level), blocks its transport into mitochondria, and inhibits it allosterically.", "hemin|feedback|feed back", "L48 s16"),
            P("Ferrochelatase is also controlled: activated by glutathione and Cu²⁺, inhibited by Pb²⁺, Mn²⁺, O₂; PBG deaminase is also a control point.", "pb|lead|glutathione", "L48 s16")
          ),
          S("Factors stimulating heme synthesis",
            P("Low heme (less hemin) removes the repression → more ALAS1.", "low heme|heme deficiency|decreased heme|less heme", "L48 s16"),
            P("Iron: when Fe is available, IRPs leave the 5′ IRE of erythroid ALAS2 mRNA → it is translated → more heme in red-cell precursors.", "ire|irp|iron responsive|iron regulatory", "L48 s57–59"),
            B("Drugs that induce cytochrome P450 (barbiturates, alcohol, steroids) use up heme → induce ALAS1; can trigger acute porphyria attacks.", "barbiturat|phenobarbital|drug|alcohol", "textbook", "Not on her slides; good if you have time."),
            B("Hypoxia / erythropoietin increase erythroid heme synthesis (HIF-2α, the EPO transcription factor, is itself under IRE control).", "erythropoietin|epo|hypoxia", "L48 s57 + textbook")
          )
        ]
      },

      /* ---------------------------------------------------------------- 12 */
      {
        id: 12, lecture: "L48", day: 6,
        q: "Porphyrias.",
        chain: "porphyrias are defects in heme synthesis → whatever is made before the enzyme block piles up and is excreted in urine and feces → genetic or acquired (liver disease, alcohol, lead, CCl4, insecticides) → hepatic, erythropoietic or mixed → early block: ALA and PBG pile up → belly and nerves: abdominal pain, vomiting, constipation, paralysis of limb and breathing muscles, restlessness → later block: porphyrins pile up → skin: light at 400 nm excites porphyrins → they react with O2 → reactive oxygen species → photodermatitis and skin necrosis → red fluorescent urine and fluorescent teeth → now walk down the pathway → ALA dehydratase → ALA dehydratase porphyria → PBG deaminase (HMB synthase) → acute intermittent porphyria, hepatic, acute attacks → uroporphyrinogen III co-synthase → congenital erythropoietic porphyria → uroporphyrinogen decarboxylase → porphyria cutanea tarda, also acquired from hexachlorobenzene (Turkey, 1950s) → coproporphyrinogen oxidase → hereditary coproporphyria → protoporphyrinogen oxidase → variegate porphyria → ferrochelatase → erythropoietic protoporphyria → ALAS2 defect → X-linked sideroblastic anemia → history: King George III, vampire and werewolf legends (photosensitivity, red teeth, hairy skin)",
        draw: "Professor’s slide 20: heme pathway as a column, with each enzyme’s porphyria in a box to the right: ALA dehydratase porphyria, acute intermittent porphyria, congenital erythropoietic porphyria, porphyria cutanea tarda, hereditary coproporphyria, variegate porphyria, erythropoietic protoporphyria.",
        hook: "The vampire rule. Early block = belly and brain: ALA and PBG pile up → abdominal pain, vomiting, paralysis, madness (Mad King George III). Late block = skin and sunlight: porphyrins pile up → photosensitivity, red fluorescent urine, glowing teeth, hairy skin — the vampires and werewolves of the Middle Ages, and the Turkish ‘monkey children’ poisoned by hexachlorobenzene wheat (PCT). Order down the pathway: ‘Don’t Ask Cute Princesses How Vampires Party’ = Doss, AIP, CEP, PCT, HCP, VP, EPP.",
        links: "Pathway and regulation from Q11. Lead also blocks ferrochelatase (Q11).",
        sections: [
          S("General",
            P("Porphyrias are disorders of heme biosynthesis: metabolites before the enzyme block accumulate and are excreted in urine and feces.", "before|accumulat|precursor", "L48 s17"),
            P("Genetic or acquired (liver disease, alcohol, CCl₄, lead, insecticides); hepatic, erythropoietic or mixed.", "hepatic; erythropoietic", "L48 s17")
          ),
          S("Symptoms by what accumulates",
            P("↑ ALA (early blocks): acute abdominal pain, vomiting, constipation, neuropsychiatric symptoms (paralysis of limb and respiratory muscles, irritability).", "abdominal; neuro|psychiatric|paralysis", "L48 s18"),
            P("↑ Porphyrins (later blocks): photosensitivity — excited at 400 nm, react with O₂ → ROS → skin damage, necrosis; fluorescent urine; phosphorescent teeth.", "photosensitiv|400|ros|fluorescent", "L48 s18")
          ),
          S("Enzyme → porphyria",
            P("ALA dehydratase → ALA-dehydratase porphyria.", "dehydratase porphyria|ala dehydratase|doss", "L48 s20"),
            P("PBG deaminase (HMB synthase) → acute intermittent porphyria (hepatic).", "acute intermittent|aip", "L48 s20"),
            P("Uroporphyrinogen III co-synthase → congenital erythropoietic porphyria.", "congenital erythropoietic|cep|gunther", "L48 s20"),
            P("Uroporphyrinogen decarboxylase → porphyria cutanea tarda; acquired form from hexachlorobenzene (Turkey, 1950s).", "cutanea tarda|pct", "L48 s20, s22"),
            P("Coproporphyrinogen oxidase → hereditary coproporphyria; protoporphyrinogen oxidase → variegate porphyria.", "coproporphyria|variegate", "L48 s20"),
            P("Ferrochelatase → erythropoietic protoporphyria.", "protoporphyria|epp", "L48 s20"),
            B("ALAS2 defects: X-linked sideroblastic anemia; X-linked dominant protoporphyria (gain of function).", "sideroblastic|xlsa|xldpp", "L48 s15"),
            B("History: King George III; vampire and werewolf myths (photosensitivity, red teeth, hypertrichosis).", "george|vampire|werewol|hypertrichosis", "L48 s21")
          )
        ]
      },

      /* ---------------------------------------------------------------- 13 */
      {
        id: 13, lecture: "L48", day: 7,
        q: "Iron metabolism.",
        chain: "body iron is 3–5 g, 75% of it in hemoglobin → free Fe2+ is dangerous: the Fenton reaction makes hydroxyl radicals, so iron is always kept bound to proteins → absorption in the duodenum → Dcytb reduces dietary Fe3+ to Fe2+ → DMT1 carries Fe2+ into the enterocyte → heme iron enters through HCP1 and the iron is released inside → in the enterocyte iron is either stored on ferritin or exported → ferroportin pumps it out → hephaestin oxidises it back to Fe3+ (ceruloplasmin does this in macrophages) → transferrin carries 2 Fe3+ in plasma → cells take it up by transferrin-receptor endocytosis → acid in the vesicle releases the iron and the receptor is recycled → storage: ferritin in liver, muscle and macrophages, about 1500 Fe3+ per molecule → overflow is deposited as hemosiderin → use: bone marrow makes heme → loss: bleeding, shed cells, sweat, urine, feces → regulation 1: hepcidin from the liver binds ferroportin and destroys it → less absorption and less release → iron deficiency lowers hepcidin → regulation 2: inside cells, IRPs bind IREs when iron is low → IRE at the 3' end (transferrin receptor, DMT1): mRNA protected → more uptake → IRE at the 5' end (ferritin, ferroportin, ALAS2): translation blocked → clinical → iron-deficiency anemia: microcytic, hypochromic, low ferritin, high TIBC, from menstrual or GI bleeding → hemochromatosis: too much absorption, hemosiderin in liver (cirrhosis), pancreas (diabetes) and skin → bronze diabetes",
        draw: "Journey: gut lumen (Fe³⁺ → Dcytb → Fe²⁺ → DMT1; heme via HCP1) → enterocyte (ferritin store, or ferroportin + hephaestin → Fe³⁺) → blood (transferrin, 2 Fe³⁺) → liver storage (ferritin → hemosiderin) and bone marrow (heme). Hepcidin ⊖ ferroportin. Small IRE box: low Fe → ↑ TfR1/DMT1 (3′ IRE), ↓ ferritin/ferroportin/ALAS2 (5′ IRE).",
        hook: "Iron’s dating life. Fe³⁺ is too stiff to get in, so Dcytb loosens her up to Fe²⁺ and DMT1 lets her through the front door. Ferroportin shows her out the back, hephaestin stiffens her back to Fe³⁺, because Transferrin only dates Fe³⁺, two at a time. Ferritin is the hotel (1,500 guests per room); when it overflows the guests sleep on the floor as hemosiderin. Hepcidin is the jealous ex from the liver who locks the back door (destroys ferroportin).",
        links: "Fe²⁺ is inserted by ferrochelatase (Q11); ALAS2 is under IRE control (Q11); heme iron is recycled after RBC breakdown (Q14).",
        sections: [
          S("Body iron",
            P("Total body iron 3–5 g; 75% in blood (hemoglobin), the rest in liver, bone marrow and muscle.", "75", "L48 s23"),
            B("Free Fe²⁺ is dangerous: Fenton reaction (Fe²⁺ + H₂O₂ → OH•) and Haber–Weiss → so iron is always kept bound to proteins.", "fenton|haber|hydroxyl", "L48 s26–27"),
            B("Heme proteins (Hb, Mb, cytochromes, catalase, NOS…) and non-heme proteins (Fe–S proteins, transferrin, ferritin).", "cytochrome|iron sulfur|fe s", "L48 s30")
          ),
          S("Absorption",
            P("In the duodenum Fe³⁺ is reduced to Fe²⁺ by duodenal cytochrome b (Dcytb) and enters through DMT1; heme iron enters via HCP1 and Fe is released inside.", "dmt1|dmt 1|divalent metal; dcytb|cytochrome b", "L48 s31–32"),
            P("In the enterocyte Fe is stored on ferritin or exported by ferroportin 1; hephaestin (or ceruloplasmin) oxidises Fe²⁺ → Fe³⁺.", "ferroportin; hephaestin|ceruloplasmin", "L48 s31, s33")
          ),
          S("Transport and uptake",
            P("Transferrin (β-globulin made in liver) carries 2 Fe³⁺ (not Fe²⁺) in plasma; normal 2–3.8 g/l.", "transferrin", "L48 s39"),
            P("Cells take up iron by transferrin-receptor endocytosis; acidic pH releases Fe, the receptor is recycled.", "receptor|endocyt", "L48 s41")
          ),
          S("Storage and use",
            P("Ferritin (24 H/L subunits, ~1,500 Fe³⁺) in liver, muscle, reticuloendothelial cells; excess deposits as hemosiderin; plasma ferritin reflects iron stores.", "ferritin; hemosiderin", "L48 s36, s44"),
            P("Main use: heme synthesis in bone marrow; iron is lost by bleeding, shed cells, sweat, urine, feces.", "bone marrow|marrow", "L48 s33, s44")
          ),
          S("Regulation",
            P("Hepcidin (25-aa liver peptide) binds ferroportin → internalisation and lysosomal degradation → less absorption and release; iron deficiency lowers hepcidin.", "hepcidin", "L48 s46–51"),
            P("IRP/IRE: low Fe → IRPs bind IREs; 3′ IRE (TfR1, DMT1) mRNA is stabilised → more uptake; 5′ IRE (ferritin, ferroportin, ALAS2) translation blocked.", "irp|ire|iron responsive|iron regulatory", "L48 s52–59")
          ),
          S("Clinical",
            P("Iron-deficiency anemia: microcytic, hypochromic; ↓ serum iron and ferritin, ↑ TIBC; causes menstrual or GI bleeding.", "microcytic|hypochromic; tibc|ferritin", "L48 s40, s63"),
            P("Hemochromatosis: excess absorption, hemosiderin in liver (cirrhosis), pancreas (diabetes) and skin → ‘bronze diabetes’.", "hemochromatosis|haemochromatosis; bronze", "L48 s62"),
            B("Normal ranges: ferritin M 30–400, F 13–150 ng/ml; TIBC 250–450 µg/dl; serum iron 5.83–34.5 µmol/l.", "ng|tibc", "L48 s60")
          )
        ]
      },

      /* ---------------------------------------------------------------- 14 */
      {
        id: 14, lecture: "L49", day: 7,
        q: "Transport of bilirubin to the liver. Formation of conjugated bilirubin.",
        chain: "red cells live 120 days → about 6 g of hemoglobin is broken down per day in macrophages of spleen, liver and bone marrow → globin → amino acids, reused → iron → transferrin, reused → heme → heme oxygenase in microsomes, with NADPH and O2 → biliverdin + CO + Fe3+ → biliverdin reductase with NADPH → bilirubin → 1 g of hemoglobin gives 35 mg of bilirubin → this unconjugated (indirect) bilirubin is fat-soluble, not water-soluble → so it travels in plasma bound to albumin → antibiotics and other organic anions can push it off albumin → above 34 µmol/l it enters the tissues: jaundice → above 350 µmol/l it enters the brain: kernicterus → at the liver it enters the hepatocyte by facilitated transport → ligandin holds it in the cytoplasm → in the ER, bilirubin-UGT (glucuronosyltransferase) adds 2 glucuronic acids from UDP-glucuronic acid → bilirubin diglucuronide = conjugated (direct) bilirubin → now water-soluble, so it can be excreted in bile → UDP-glucuronic acid comes from UDP-glucose by UDP-glucose dehydrogenase → phenobarbital induces UGT → normal total bilirubin 3.4–17 µmol/l, direct 0.8–8.5 µmol/l",
        draw: "Macrophage: heme → (heme oxygenase, NADPH + O₂ → CO + Fe³⁺) biliverdin → (biliverdin reductase, NADPH) bilirubin. Blood: bilirubin–albumin. Hepatocyte: facilitated uptake → ligandin → ER: bilirubin-UGT + 2 UDP-glucuronic acid → bilirubin diglucuronide.",
        hook: "Bilirubin is a greasy hitchhiker who can’t swim in plasma, so it rides Albumin’s taxi. Some antibiotics steal its seat, and a loose bilirubin can wander into a baby’s brain (kernicterus). At the liver, a revolving door lets it in, Ligandin escorts it to the ER, and UGT dresses it in two glucuronic-acid swimsuits. Now it’s ‘direct’, water-soluble, and can swim out into the bile.",
        links: "What happens next in bile is Q15; jaundice patterns in Q16; iron is recycled to transferrin (Q13).",
        sections: [
          S("Formation",
            P("RBCs live 120 days; ~6 g Hb/day is degraded in reticuloendothelial cells (spleen, liver, bone marrow); globin → amino acids and Fe → transferrin are reused.", "120; reticuloendothelial|spleen|macrophage", "L49 s2"),
            P("Heme → biliverdin by heme oxygenase (microsomes; NADPH + O₂, releases CO and Fe³⁺) → bilirubin by biliverdin reductase (NADPH).", "heme oxygenase|haem oxygenase; biliverdin", "L49 s3"),
            B("1 g Hb gives 35 mg bilirubin; 250–350 mg/day.", "35|250", "L49 s5")
          ),
          S("Transport to the liver",
            P("Unconjugated (indirect) bilirubin is lipophilic and poorly water-soluble → transported in plasma bound to albumin.", "albumin; unconjugated|indirect", "L49 s5"),
            P("Antibiotics and other organic anions compete for albumin’s high-affinity site and can displace bilirubin.", "displace|antibiotic|drug|compet", "L49 s5"),
            P("Above 34 µmol/l bilirubin enters tissues (jaundice); above 350 µmol/l it enters the brain (kernicterus).", "kernicterus", "L49 s6"),
            P("Hepatocytes take it up by facilitated transport (large capacity, not rate-limiting) and bind it to ligandin in the cytoplasm.", "facilitated; ligandin", "L49 s6, s8")
          ),
          S("Conjugation",
            P("In the ER, bilirubin-UGT (glucuronosyltransferase) adds two glucuronic acids → bilirubin diglucuronide = conjugated (direct) bilirubin, polar and excreted in bile.", "ugt|glucuronosyltransferase|glucuronyltransferase; diglucuronide|glucuronic|glucuronate", "L49 s8–10"),
            P("The donor is UDP-glucuronic acid, made from UDP-glucose by UDP-glucose dehydrogenase (2 NAD⁺).", "udp glucuronic|udp glucose", "L49 s11"),
            P("Phenobarbital induces bilirubin-UGT (and secretion).", "phenobarbital", "L49 s8"),
            B("Reference values: total bilirubin 3.4–17 (21) µmol/l; direct 0.8–8.5 µmol/l.", "17|8 5", "L49 s5")
          )
        ]
      },

      /* ---------------------------------------------------------------- 15 */
      {
        id: 15, lecture: "L49", day: 8,
        q: "Elimination of bile pigments.",
        chain: "conjugated bilirubin in the hepatocyte → MRP-2, an ATP-dependent ABC transporter in the canalicular membrane, pumps it into bile → this is the slowest, rate-limiting step → phenobarbital speeds it up; a mutation of MRP-2 is Dubin-Johnson syndrome → bile → intestine → in the terminal ileum and colon, bacterial β-glucuronidases remove the glucuronic acids → bacteria reduce bilirubin → mesobilirubin → mesobilirubinogen → urobilinogen and stercobilinogen, colourless bile pigments → most of it is oxidised in the colon to stercobilin → the brown colour of feces, 40–280 mg per day → a small part of the urobilinogen is reabsorbed → portal blood → liver → back into bile: the enterohepatic urobilinogen cycle → a little escapes through the hemorrhoidal veins into the vena cava → kidney → urine as urobilinogen, 0–4 mg per day → normal urine has only traces of urobilinogen and no bilirubin",
        draw: "Loop: hepatocyte → (MRP-2, ATP) bile → terminal ileum/colon: β-glucuronidase → bilirubin → mesobilirubin → mesobilirubinogen → urobilinogen/stercobilinogen → stercobilin → feces. Branches: some urobilinogen reabsorbed → portal → liver (enterohepatic cycle); a little → hemorrhoidal veins → systemic blood → kidney → urine.",
        hook: "Poop is brown and pee is yellow because of the same molecule. MRP-2 pumps the dressed-up bilirubin into bile (the slowest, rate-limiting step). In the colon, bacteria strip off its glucuronide swimsuit and turn it into colourless urobilinogen. Most of it oxidises to brown stercobilin and ends in the toilet; some sneaks back up to the liver (the enterohepatic U-turn); a little escapes through the hemorrhoidal back door to the kidney.",
        links: "Conjugation in Q14; when these numbers change → Q16. MRP-2 mutation = Dubin–Johnson (Q16).",
        sections: [
          S("Secretion into bile",
            P("Conjugated bilirubin is secreted into bile by active transport via MRP-2 (MOAT, an ATP-binding cassette transporter) in the canalicular membrane — the rate-limiting step.", "mrp2|mrp 2|moat|abc; rate limiting|active", "L49 s12"),
            P("This transport is induced by the same drugs that induce conjugation (phenobarbital); its genetic defect is Dubin–Johnson syndrome.", "phenobarbital|dubin", "L49 s12, s23")
          ),
          S("In the intestine",
            P("In terminal ileum and colon, bacterial β-glucuronidases remove the glucuronic acids.", "glucuronidase", "L49 s14"),
            P("Bacteria reduce bilirubin → mesobilirubin → mesobilirubinogen → urobilinogen / stercobilinogen (colourless) = bile pigments.", "urobilinogen|stercobilinogen", "L49 s14"),
            P("Most stercobilinogen is oxidised in the colon to stercobilin (coloured) and excreted in feces (40–280 mg/day).", "stercobilin; feces|faeces|stool", "L49 s14, s19")
          ),
          S("Enterohepatic cycle and urine",
            P("A small part of urobilinogen is reabsorbed and re-excreted by the liver = enterohepatic urobilinogen cycle.", "enterohepatic", "L49 s15"),
            P("A small part enters systemic blood via the hemorrhoidal veins and vena cava → kidney → urine as urobilinogen (0–4 mg/day).", "hemorrhoidal|haemorrhoidal|kidney|urine", "L49 s15, s19"),
            P("Normally urine contains only traces of urobilinogen and no bilirubin.", "trace", "L49 s18")
          )
        ]
      },

      /* ---------------------------------------------------------------- 16 */
      {
        id: 16, lecture: "L49", day: 8,
        q: "Changes in the levels of bile pigments in hemolytic, parenchymal, obstructive and neonatal jaundice.",
        chain: "normal: total bilirubin 3.4–17 µmol/l, traces of urobilinogen in urine, no bilirubin in urine, brown feces → above 34 µmol/l: jaundice → rule 1: only conjugated bilirubin is water-soluble, so only it can appear in urine → rule 2: only unconjugated bilirubin crosses the blood-brain barrier → hemolytic (pre-hepatic) jaundice → too much heme is broken down → unconjugated bilirubin rises → the healthy liver conjugates and excretes more → more urobilinogen in urine → no bilirubin in urine → very dark feces → parenchymal (hepatic) jaundice, for example hepatitis → damaged liver cells take up, conjugate and secrete badly → both conjugated and unconjugated bilirubin rise → urobilinogen and bilirubin in urine → if urobilinogen disappears from urine, the liver damage is very severe → obstructive (post-hepatic) jaundice: stones, tumour → conjugated bilirubin cannot reach the gut and leaks back into blood → conjugated bilirubin rises → bilirubin in urine: dark brown urine → no urobilinogen in urine, because nothing reaches the gut bacteria → pale, fatty feces → neonatal (physiologic) jaundice → extra hemolysis at birth + an immature liver: low uptake, low UGT, little UDP-glucuronic acid → unconjugated bilirubin rises for a few days → above 350–400 µmol/l risk of kernicterus → treat with blue-light phototherapy and phenobarbital → hereditary forms: Crigler-Najjar I (no UGT, fatal), Crigler-Najjar II (low UGT, phenobarbital helps), Gilbert (mild), Dubin-Johnson (MRP-2 defect), Rotor (benign)",
        draw: "Professor’s table (slide 19): rows Normal / Hemolytic / Parenchymal / Obstructive (+ Neonatal) × columns blood bilirubin (which type), urine urobilinogen, urine bilirubin, stercobilinogen in feces.",
        hook: "Read the toilet. Hemolytic: dark poop, normal-looking pee with lots of urobilinogen but no bilirubin — too much bilirubin is made, the liver is fine. Obstructive: white, fatty poop and Coca-Cola pee — conjugated bilirubin can’t get out, so it leaks into blood and urine, and no urobilinogen is made. Hepatitis: a bit of everything in the pee (urobilinogen and bilirubin); if urobilinogen disappears, the liver is in serious trouble. Newborn: the baby under the blue lamp, liver still in training.",
        links: "Built on Q14 (conjugation) and Q15 (elimination). ALT rises in hepatitis (Q3).",
        sections: [
          S("Basics",
            P("Hyperbilirubinemia above 17.1 µmol/l; jaundice (icterus) visible above 34 µmol/l.", "34|icterus", "L49 s17"),
            P("Only unconjugated bilirubin crosses the blood–brain barrier (kernicterus > 350 µmol/l); only conjugated bilirubin can appear in urine.", "unconjugated; conjugated; urine", "L49 s17")
          ),
          S("Hemolytic (pre-hepatic)",
            P("Hemolytic jaundice: ↑ unconjugated bilirubin (< 68 µmol/l in hemolytic anemia), ↑ urobilinogen in urine, no bilirubin in urine, very dark feces.", "hemolytic|haemolytic; dark", "L49 s18–19, s21")
          ),
          S("Parenchymal (hepatic)",
            P("Parenchymal jaundice (hepatitis): ↑ mainly conjugated but also unconjugated bilirubin; ↑ urobilinogen and bilirubin in urine.", "parenchymal|hepatitis|hepatic", "L49 s18–19"),
            P("Disappearance of urobilinogen from urine = very severe liver damage (or microobstruction).", "disappear|severe|microobstruction", "L49 s18")
          ),
          S("Obstructive (post-hepatic)",
            P("Obstructive jaundice (stones, tumours, cholestasis): ↑ conjugated bilirubin, bilirubin in urine (dark brown urine), no urobilinogen in urine, pale fatty feces.", "obstructi|cholesta; pale|white|clay", "L49 s18–19, s23")
          ),
          S("Neonatal",
            P("Physiologic neonatal jaundice: accelerated hemolysis at birth + immature uptake, conjugation and UDP-glucuronic acid synthesis → transient ↑ unconjugated bilirubin.", "neonatal|newborn|physiologic; immature", "L49 s21"),
            P("Risk of kernicterus above 350–400 µmol/l; therapy phenobarbital (induces UGT) and blue-light phototherapy.", "phototherapy|blue light", "L49 s21")
          ),
          S("Hereditary forms",
            B("Unconjugated: Crigler–Najjar I (no UGT, lethal, transplant only), Crigler–Najjar II (↓ UGT, phenobarbital works), Gilbert (↓ UGT, mild).", "crigler|gilbert", "L49 s21–22"),
            B("Conjugated: Dubin–Johnson (MRP-2 mutation, dark pigment in hepatocytes), Rotor (benign).", "dubin|rotor", "L49 s23")
          )
        ]
      },

      /* ---------------------------------------------------------------- 17 */
      {
        id: 17, lecture: "L50", day: 9,
        q: "Regulation of de novo synthesis of purines.",
        chain: "purines are built directly on ribose → ribose-5-phosphate + ATP → PRPP synthetase → PRPP → glutamine-PRPP amidotransferase adds an amino group from glutamine → 5-phosphoribosylamine, the first committed step → the ring is built from glycine, glutamine, aspartate, CO2 and folate carbons → IMP, the first purine nucleotide → IMP branches in two → adenylosuccinate synthetase, using GTP → adenylosuccinate → AMP → IMP dehydrogenase → XMP → GMP, using ATP → regulation at 4 points → 1. PRPP synthetase is inhibited by the purine nucleotides ADP and GDP → 2. the amidotransferase is inhibited by AMP, GMP and IMP and activated by PRPP (feed-forward) → 3. AMP inhibits adenylosuccinate synthetase → 4. GMP inhibits IMP dehydrogenase → cross-regulation: GTP is needed to make AMP and ATP to make GMP, so adenine and guanine nucleotides stay balanced → salvage by HGPRT and APRT uses PRPP to recycle free bases and spares de novo synthesis → when the brakes fail (a superactive PRPP synthetase, an amidotransferase that ignores feedback) → too many purines → gout",
        draw: "Professor’s slide 17: ribose-5-P → (PRPP synthetase) PRPP → (glutamine-PRPP amidotransferase, ⊕ PRPP) 5-phosphoribosylamine → … → IMP → branches: IMP dehydrogenase → XMP → GMP → GDP → GTP and adenylosuccinate synthetase → adenylosuccinate → AMP → ADP → ATP, with ⊖ feedback loops from the end products to each enzyme.",
        hook: "The purine factory has two managers: PRPP synthetase at the gate and the amidotransferase at the assembly line. PRPP is the hype-man who pushes the amidotransferase on. AMP and GMP are HR: when the warehouse is full they shut the gate and the line. The twins A and G pay for each other — GTP pays for AMP, ATP pays for GMP — so neither twin gets spoilt.",
        links: "Loss of this feedback = gout (Q18). PRPP also activates pyrimidine synthesis (Q20). Glutamine N donor (Q8).",
        sections: [
          S("Pathway essentials",
            P("Purines are built directly on ribose-5-phosphate (as PRPP); the first product is IMP. Precursors: glycine, glutamine, aspartate, CO₂, folate one-carbon units.", "prpp; imp|inosine", "L50 s9–13"),
            P("PRPP synthetase: ribose-5-phosphate + ATP → PRPP (activated ribose).", "prpp synthetase", "L50 s11"),
            P("First committed step: glutamine-PRPP amidotransferase: PRPP + glutamine → 5-phosphoribosylamine.", "amidotransferase|phosphoribosylamine", "L50 s12"),
            P("IMP → AMP via adenylosuccinate synthetase; IMP → XMP → GMP via IMP dehydrogenase.", "adenylosuccinate; imp dehydrogenase|xmp", "L50 s15, s17")
          ),
          S("Regulation",
            P("PRPP synthetase is feedback-inhibited by purine nucleotides (ADP, GDP).", "prpp synthetase; inhibit|feedback|feed back", "L50 s17"),
            P("Glutamine-PRPP amidotransferase (committed step) is inhibited by AMP, GMP, IMP and activated by PRPP (feed-forward).", "amidotransferase; activat", "L50 s17"),
            P("Branch-point control: AMP inhibits adenylosuccinate synthetase, GMP inhibits IMP dehydrogenase.", "adenylosuccinate synthetase; imp dehydrogenase; inhibit", "L50 s17"),
            P("Cross-regulation: GTP is needed to make AMP and ATP to make GMP → balanced adenine and guanine nucleotides.", "gtp; balance|cross|reciprocal", "L50 s15"),
            B("Salvage (HGPRT, APRT) uses PRPP and returns nucleotides that feed back → spares de novo synthesis.", "hgprt|aprt|salvage", "L50 s18–19"),
            B("Clinical link: superactive PRPP synthetase or feedback-insensitive amidotransferase → purine overproduction → gout.", "gout", "L50 s30")
          )
        ]
      },

      /* ---------------------------------------------------------------- 18 */
      {
        id: 18, lecture: "L50", day: 9,
        q: "Clinical aspects of purine metabolism - diseases.",
        chain: "purine breakdown first → AMP → adenosine → adenosine deaminase → inosine → hypoxanthine → xanthine oxidase → xanthine → xanthine oxidase → uric acid → GMP → guanosine → guanine → xanthine → uric acid → uric acid is poorly soluble, and that causes the diseases → normal serum uric acid 172–410 µmol/l → gout = hyperuricemia → sodium urate crystals in joint fluid → severe inflammation and arthritis → primary causes: superactive PRPP synthetase (high Vmax, low Km, resistant to feedback), an amidotransferase that ignores feedback, partial HGPRT deficiency → secondary causes: more cell breakdown (leukemia, radiotherapy), kidney failure, drugs like diuretics, von Gierke disease (glucose-6-phosphatase deficiency) → above 600 µmol/l the vascular risk rises → treatment: allopurinol blocks xanthine oxidase → Lesch-Nyhan syndrome: complete HGPRT deficiency, X-linked, so boys → severe gout + neurological damage + self-mutilation → death usually before 20 → immunodeficiency: adenosine deaminase deficiency → SCID; purine nucleoside phosphorylase deficiency → immunodeficiency, because lymphocytes depend on salvage → xanthine oxidase deficiency → xanthinuria: low uric acid and xanthine kidney stones → APRT deficiency → kidney stones",
        draw: "Catabolism line: AMP → adenosine → (adenosine deaminase) inosine → hypoxanthine → (xanthine oxidase) xanthine → (xanthine oxidase) uric acid; GMP → guanosine → guanine → xanthine. Put disease boxes at each enzyme: ADA → SCID, PNP → immunodeficiency, xanthine oxidase → xanthinuria, HGPRT (salvage) → Lesch–Nyhan / gout, PRPP synthetase → gout.",
        hook: "Gout is the king’s disease: after a royal feast, urate needles stab the big toe. Lesch–Nyhan: a boy with HGPRT completely gone — gout plus he bites his own lips and fingers; partial HGPRT is ‘just’ gout. SCID is the bubble boy: no adenosine deaminase, lymphocytes poisoned. Xanthinuria is the opposite: no xanthine oxidase, so too little uric acid and xanthine stones instead.",
        links: "Regulation failures from Q17. High PRPP also raises β-alanine (Q20).",
        sections: [
          S("Background",
            P("Purine nucleotides → nucleosides (5′-nucleotidase); adenosine → inosine (adenosine deaminase) → hypoxanthine → xanthine → uric acid (xanthine oxidase); guanine → xanthine.", "xanthine oxidase; uric|urate", "L50 s27"),
            P("Problems come from the poor solubility of uric acid; serum uric acid 172.5–410 µmol/l.", "insolub|solub", "L50 s28–29", "Slide prints mmol/l; it means µmol/l.")
          ),
          S("Gout (hyperuricemia)",
            P("Gout: hyperuricemia → sodium urate crystals in synovial fluid → severe inflammation and arthritis.", "gout; crystal", "L50 s28, s30"),
            P("Primary causes: superactive PRPP synthetase (↑ Vmax, resistant to feedback, ↓ Km), feedback-insensitive amidotransferase, partial HGPRT deficiency.", "prpp synthetase; hgprt|amidotransferase|feedback", "L50 s30, s35"),
            P("Secondary causes: increased cell breakdown (leukemia, radiotherapy), renal insufficiency, drugs (diuretics, cytostatics), von Gierke’s disease (glucose-6-phosphatase).", "gierke|renal|leuk|diuretic", "L50 s29, s33–34"),
            B("Uric acid > 600 µmol/l increases vascular risk, especially with diabetes, hypertension, obesity.", "600|vascular", "L50 s29"),
            B("Treatment: allopurinol (xanthine oxidase inhibitor).", "allopurinol", "textbook", "Not on her slides.")
          ),
          S("Lesch–Nyhan syndrome",
            P("Lesch–Nyhan: complete HGPRT deficiency, X-linked (boys); severe gout + neurological disability + self-mutilation; death usually before 20.", "lesch|nyhan; hgprt|self mutilation|self injur", "L50 s32")
          ),
          S("Immunodeficiencies and others",
            P("Adenosine deaminase deficiency → severe combined immunodeficiency (SCID); purine nucleoside phosphorylase deficiency → immunodeficiency (lymphocytes rely on salvage).", "scid|adenosine deaminase|ada; pnp|nucleoside phosphorylase", "L50 s33, s36", "Slide 33 says ‘AMP deaminase’, but her table on slide 36 says ADA; ADA is correct."),
            P("Xanthinuria: xanthine oxidase deficiency → hypouricemia and xanthine kidney stones.", "xanthinuria", "L50 s33, s36"),
            B("APRT deficiency → renal lithiasis (kidney stones).", "aprt|lithiasis", "L50 s33")
          )
        ]
      },

      /* ---------------------------------------------------------------- 19 */
      {
        id: 19, lecture: "L50", day: 10,
        q: "Synthesis of deoxynucleotides. Regulation.",
        chain: "DNA needs deoxyribonucleotides → they are made at the diphosphate level → ribonucleotide reductase: NDP → dNDP (ADP, GDP, CDP and UDP) → the electrons come from thioredoxin, which becomes oxidised to a disulfide → thioredoxin reductase regenerates it using NADPH → regulation: 2 allosteric sites → the activity site: ATP switches the enzyme on, dATP switches it off → the specificity site chooses the substrate → ATP bound → CDP and UDP are reduced → dTTP bound → GDP is reduced → dGTP bound → ADP is reduced → dATP piles up → the whole enzyme switches off → so all four dNTPs stay balanced → thymine: dUDP → dUMP → thymidylate synthase adds a methyl from N5,N10-methylene-THF → dTMP + dihydrofolate → dihydrofolate reductase (DHFR) with NADPH → THF → serine hydroxymethyltransferase (serine → glycine) → methylene-THF again → drugs: 5-fluorouracil (as FdUMP) blocks thymidylate synthase; methotrexate blocks DHFR → DNA synthesis stops in cancer cells → B12 or folate deficiency → too little dTMP → salvage: thymidine kinase makes dTMP from thymidine, inhibited by dTTP and rising when cells enter S phase",
        draw: "NDP → dNDP with the thioredoxin loop (ribonucleotide reductase; thioredoxin –SH/–SH → S–S; thioredoxin reductase, NADPH). Then dUMP → dTMP with the folate cycle (thymidylate synthase, N⁵,N¹⁰-methylene-THF → DHF; DHFR, NADPH → THF; serine hydroxymethyltransferase, serine → glycine), with 5-FU and methotrexate blocks.",
        hook: "Ribonucleotide reductase is a bouncer with two doors. The on/off door: ATP says ‘open’, dATP says ‘we’re full, close’. The guest-list door: ATP lets in C and U, dTTP lets in G, dGTP lets in A — and when dATP piles up the whole club shuts. Thymidylate synthase sticks a methyl moustache on dUMP to make T, paying with folate. Methotrexate steals the folate wallet (DHFR), 5-FU jams the moustache machine.",
        links: "dTMP and chemo drugs also in Q20. Uses the PRPP-made NDPs from Q17.",
        sections: [
          S("Ribonucleotide reductase",
            P("Deoxyribose is made by reduction at the nucleoside diphosphate level: NDP → dNDP by ribonucleotide reductase.", "ribonucleotide reductase; diphosphate|ndp|dndp", "L50 s23, L51 s12"),
            P("Electrons come from thioredoxin (–SH → S–S); thioredoxin reductase regenerates it using NADPH.", "thioredoxin; nadph", "L50 s23–24, L51 s12")
          ),
          S("Regulation of ribonucleotide reductase",
            P("Two allosteric sites: one controls activity, the other substrate specificity.", "allosteric|activity site|specificity", "L50 s25"),
            P("Activity site: ATP activates, dATP inhibits the whole enzyme.", "datp", "L50 s25"),
            P("Specificity site: ATP → reduction of CDP and UDP; dTTP → GDP; dGTP → ADP; accumulating dATP then switches the enzyme off.", "dttp; dgtp", "L50 s25")
          ),
          S("Synthesis of dTMP",
            P("dUDP → dUMP; thymidylate synthase: dUMP + N⁵,N¹⁰-methylene-THF → dTMP + dihydrofolate (methyl group).", "thymidylate synthase; methylene", "L51 s13"),
            P("Dihydrofolate reductase (NADPH) regenerates THF; serine hydroxymethyltransferase (serine → glycine, PLP) remakes methylene-THF.", "dihydrofolate reductase|dhfr; serine hydroxymethyl|shmt", "L51 s13"),
            P("Chemotherapy targets: 5-fluorouracil (→ FdUMP) inhibits thymidylate synthase; methotrexate inhibits DHFR.", "fluorouracil|5 fu|fdump; methotrexate", "L51 s23"),
            B("Salvage: thymidine kinase makes dTMP from thymidine; inhibited by dTTP, rises sharply as cells enter S phase.", "thymidine kinase", "L51 s16"),
            B("B12 / folate deficiency → dTMP deficiency.", "b12|folate|folic", "L51 s22")
          )
        ]
      },

      /* ---------------------------------------------------------------- 20 */
      {
        id: 20, lecture: "L51", day: 10,
        q: "Clinical aspects of pyrimidine metabolism - diseases.",
        chain: "the pathway first → cytosol: glutamine + CO2 + 2 ATP → CPS II → carbamoyl phosphate → aspartate transcarbamoylase, the rate-limiting step → carbamoyl aspartate → dihydroorotase → dihydroorotate → these 3 enzymes form CAD → dihydroorotate dehydrogenase in the mitochondria → orotate → + PRPP → orotate phosphoribosyltransferase → OMP → OMP decarboxylase → UMP → these last 2 activities form UMP synthase → CPS II is activated by PRPP and inhibited by UTP → now the diseases → orotic aciduria: a UMP synthase defect → type I: both enzymes missing, type II: only OMP decarboxylase → orotic acid piles up and is excreted in urine → no UMP, so no new cells: severe anemia, leukopenia, poor growth → treat with oral uridine and cytidine → salvage kinases turn them into UMP, going around the block → OTC deficiency (urea cycle) → carbamoyl phosphate leaks from the mitochondria into the cytosol → extra pyrimidine synthesis → orotic aciduria with hyperammonemia → hyperuricemia with high PRPP → too many pyrimidines → more β-alanine in urine → vitamin B12 and folate deficiency → too little dTMP → chemotherapy: 5-fluorouracil blocks thymidylate synthase, methotrexate blocks DHFR → pyrimidine breakdown products (β-alanine, β-aminoisobutyrate, CO2, NH3) are water-soluble, so unlike uric acid they cause no crystals",
        draw: "UMP pathway: glutamine + CO₂ + 2 ATP → (CPS II) carbamoyl phosphate → (ATCase) carbamoyl aspartate → (dihydroorotase) dihydroorotate [CAD] → (DHODH, mitochondria) orotate → (+PRPP, OPRT) OMP → (OMP decarboxylase) UMP [UMP synthase]. ⊗ at OPRT/ODC = orotic aciduria I/II; side arrow from mitochondrial carbamoyl phosphate (OTC deficiency). Plus dUMP → dTMP with 5-FU and methotrexate blocks.",
        hook: "Orotic acid is the traffic jam before a broken bridge (UMP synthase). No UMP means no new blood cells: anemia, leukopenia, a child who doesn’t grow. The detour is uridine: swallow it and the salvage kinase builds UMP on the other side of the bridge. OTC deficiency makes the same orange jam, because carbamoyl phosphate spills out of the mitochondria — but it also stinks of ammonia.",
        links: "OTC and CPS I in Q9. dTMP, 5-FU and methotrexate in Q19. High PRPP links to gout (Q18).",
        sections: [
          S("Pathway background",
            P("De novo UMP: CPS II (cytosol, glutamine + CO₂ + ATP) → aspartate transcarbamoylase (rate-limiting) → dihydroorotase — the three form CAD — → dihydroorotate dehydrogenase (mitochondria) → orotate.", "cps ii|cps 2|carbamoyl phosphate synthetase ii|cad; aspartate transcarbamoylase|atcase", "L51 s6–9"),
            P("Orotate + PRPP → OMP (orotate phosphoribosyltransferase) → UMP (OMP decarboxylase); these two activities form UMP synthase.", "orotate phosphoribosyl|oprt; omp decarboxylase|orotidine", "L51 s9"),
            B("Regulation: CPS II activated by PRPP, inhibited by UTP and purine nucleotides; UTP/CTP feed back on ATCase.", "utp|ctp", "L51 s14")
          ),
          S("Orotic aciduria",
            P("Type I: deficiency of both orotate phosphoribosyltransferase and OMP decarboxylase; type II: OMP decarboxylase only.", "orotic aciduria; type", "L51 s22"),
            P("Orotic acid accumulates and is excreted in urine; no UMP → retarded growth, severe anemia, leukopenia.", "anemia|anaemia; leukopenia|growth", "L51 s22"),
            P("Therapy: oral uridine and/or cytidine → UMP via nucleoside kinases (salvage bypasses the block).", "uridine|cytidine", "L51 s22")
          ),
          S("Other clinical links",
            P("OTC deficiency (urea cycle): mitochondrial carbamoyl phosphate leaks to the cytosol → ↑ pyrimidine synthesis → mild orotic aciduria (with hyperammonemia).", "otc|ornithine transcarbamoylase", "L51 s22, L43 s30"),
            P("Hyperuricemia with high PRPP → overproduction of pyrimidines → ↑ β-alanine excretion.", "beta alanine; prpp|hyperuric", "L51 s22"),
            P("Vitamin B12 and folic acid deficiency → deficiency of dTMP.", "b12|folate|folic", "L51 s22"),
            P("Thymidylate synthase is a chemotherapy target: 5-fluorouracil (FdUMP) inhibits it, methotrexate inhibits dihydrofolate reductase.", "fluorouracil|5 fu|fdump; methotrexate", "L51 s23"),
            B("Pyrimidine catabolism products (β-alanine, β-aminoisobutyrate, CO₂, NH₄⁺) are soluble, so harmless — unlike urate.", "aminoisobutyrate|soluble|harmless", "L51 s18"),
            B("First catabolic enzyme is dihydropyrimidine dehydrogenase (circled on her slide).", "dihydropyrimidine", "L51 s20")
          )
        ]
      }
    ]
  };
})();
