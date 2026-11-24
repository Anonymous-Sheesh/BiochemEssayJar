/* On call hints: casual questions she can send when he's missed something.
   They point at the IDEA he forgot (the why / what it does), not the word, so he works it out.
   Each hint is [question, "answer words"]: the answer words are matched against the story's
   key words, so once she's ticked all of them the question disappears from her list.
   One list per part of each essay, in the same order as the story. */
window.CALL_HINTS = {
  1: [
    [["Can the mouth actually cut protein? Why not?", "mouth;no proteases"], ["Where does it go next, and what's in there?", "stomach;hcl"], ["What does the acid do to the protein's shape?", "unfold;denature"], ["Why is pepsin made switched off first, and what switches it on?", "pepsinogen;zymogen;acid;soft"], ["Does pepsin cut at the ends or in the middle? So what comes out?", "pepsin;middle;endopeptidase;big peptides"]],
    [["What neutralises the acid when it reaches the duodenum?", "duodenum;bicarbonate"], ["What does the pancreas send in, and in what state?", "trypsinogen, chymo"], ["Who switches on the first pancreatic enzyme, and what does that one do to the others?", "enterokinase;trypsin;all the others"], ["Who finishes the job right on the gut wall, and what's left at the end?", "brush border;free amino acids"]],
    [["How do amino acids get into the gut cell: alone or with something?", "with sodium;na+ cotransport"], ["Where do they go after the gut cell?", "portal blood"]],
    [["Where do they go next, and what do most of them become?", "liver;new proteins"], ["What happens to the nitrogen of the rest, and how does it leave the body?", "nh3"], ["And the carbon part that's left?", "energy or glucose"]]
  ],
  2: [
    [["Are body proteins kept forever? What's that called?", "protein turnover"], ["What happens to most of the amino acids after a protein is broken down?", "recycles"], ["Two reasons a protein gets destroyed?", "broken ones;regulation;short-contract;bossy"]],
    [["First way: what's the acid bag called and how acidic is it?", "lysosome;acid (ph 5)"], ["Which enzymes are inside?", "acid hydrolases"], ["How does stuff get into it, from outside and from inside the cell?", "endocytosis;autophagy"]],
    [["What's the tag that marks a protein for death?", "ubiquitin"], ["E1, E2, E3: who does what, and which one decides who gets it?", "e1;e2;e3;atp"], ["One tag isn't enough. What forms?", "polyubiquitin"], ["What machine reads the tags, and what does it do to the protein?", "26s proteasome;unfolds"], ["What comes out, and what happens to the tags?", "short peptides;reused"]]
  ],
  3: [
    [["What exactly gets swapped in transamination, and onto what?", "transamination;amino group;amino acid;α-ketoglutarate"], ["Which enzyme does it, and which vitamin has to be there?", "transaminase;plp"], ["Can it go backwards?", "both ways;reversible"], ["Who ends up holding everyone's nitrogen?", "glutamate"]],
    [["Alanine swaps its amino group and becomes what?", "alanine → pyruvate;alt"], ["Which organ is ALT a marker for, and when does it go really high?", "a liver thing;liver damage"]],
    [["Aspartate swaps its amino group and becomes what?", "aspartate → oxaloacetate;ast"], ["Which organ is AST famous for? Which disease?", "a sore ticker;heart, liver;heart attack"]],
    [["What happens to the nitrogen on glutamate at the end? What's the combo called?", "glutamate dehydrogenase;nh3;transdeamination"]]
  ],
  4: [
    [["What is deamination, in one sentence?", "deamination;amino group;nh3"], ["Which kind uses oxygen, which enzymes, and where are they?", "oxidative;amino acid oxidases;peroxisomes"], ["Can the oxidases go backwards?", "never go;irreversible"]],
    [["Which enzyme is the main one, and where is it?", "glutamate dehydrogenase;mitochondria;glutamate → α-ketoglutarate"], ["What's special about GDH compared to the oxidases?", "both ways;reversible;pull out or slide"], ["What turns GDH on and what turns it off? Why does that make sense?", "adp;atp"]],
    [["Transdeamination is two enzymes in a row. Which two, and in what order?", "transdeamination;transaminase;glutamate;gdh"], ["How do most amino acids lose their nitrogen?", "most amino acids"]],
    [["Which vitamin do the non-oxidative ones need?", "non-oxidative;plp"], ["What does serine become? And cysteine?", "serine → pyruvate;cysteine → pyruvate"]]
  ],
  5: [
    [["What amino acid is serotonin made from?", "tryptophan"], ["First step: which enzyme, what helper, what product?", "tryptophan hydroxylase;bh4;5-hydroxytryptophan"], ["Second step: what's removed, with what vitamin?", "decarboxylase;plp;serotonin"]],
    [["Where is most of the serotonin actually stored?", "gut and platelets"], ["What does it do in the brain? Which drugs target it?", "brain neurotransmitter;antidepressants"], ["What does it do to blood vessels?", "squeezes blood vessels"], ["Which enzyme breaks it down?", "mao"]],
    [["Where is melatonin made?", "pineal gland"], ["What two groups get added to serotonin to make melatonin?", "acetyl;methyl;melatonin"]],
    [["What switches melatonin on, so when is it high?", "darkness;high at night"], ["What does melatonin do to sleep and to sex drive?", "lowers the drive;kills the sex drive;fall asleep"], ["So what's it used for as a drug?", "sleep drug"]]
  ],
  6: [
    [["What amino acid do all three come from?", "tyrosine"], ["Which step is the slow one, the one that controls everything?", "tyrosine hydroxylase;bh4;slow step"], ["Put them in order: what comes from what?", "dopa;dopamine;norepinephrine;epinephrine"]],
    [["Where in the brain is dopamine the main transmitter?", "substantia nigra"], ["Which one do sympathetic nerves actually release?", "sympathetic nerves"], ["Where does epinephrine come from?", "adrenal medulla"]],
    [["Which two enzymes break them down?", "mao and comt"], ["What's the end product of dopamine? And of the other two?", "dopamine → hva;norepinephrine/epinephrine → vma"]],
    [["Which neurons die in Parkinson's?", "parkinson;dopamine neurons die"], ["What are the main symptoms?", "tremor, stiffness"], ["Why give L-DOPA instead of dopamine? Why add carbidopa?", "l-dopa"]]
  ],
  7: [
    [["Where does ammonia come from? Name two sources.", "ammonia (nh3);deaminated;glutamate;gut bacteria"]],
    [["Who normally clears ammonia from the blood?", "liver"], ["What goes wrong in cirrhosis to make ammonia rise?", "cirrhosis;bypasses;hyperammonemia"]],
    [["Where does the ammonia go that makes it so dangerous?", "nh3 gets into the brain"], ["It steals something from the Krebs cycle. What, and what happens to energy?", "α-ketoglutarate;krebs cycle;no atp"], ["It also uses up glutamate. Why does that matter for brakes in the brain?", "less gaba"], ["What symptoms does it cause?", "tremor, slurred"]]
  ],
  8: [
    [["Why can't ammonia travel raw? First way to pack it: which enzyme, running which way, makes what?", "glutamate;gdh;α-ketoglutarate + nh3"]],
    [["Second, safer pack: what's it called, which enzyme, and what does it cost?", "glutamine;glutamine synthetase;second nh3;atp"], ["Where is it mostly made?", "brain"], ["What's the main safe carrier of ammonia in blood?", "safe ammonia carrier"], ["When it arrives at the kidney, what happens? And at the liver?", "glutaminase;kidney;urine;pissed out;liver;urea"]],
    [["How does muscle send its nitrogen to the liver?", "muscle;glucose–alanine cycle;alanine"], ["What does the liver send back to muscle?", "glucose"]]
  ],
  9: [
    [["What does the urea cycle turn into what, and where?", "urea cycle;liver;nh3;urea"], ["Which enzyme starts it, what does it make, and what does it need to switch on?", "cps i;carbamoyl phosphate;nh3 + co2;slow step;n-acetylglutamate"], ["Go round the cycle: what comes after ornithine?", "ornithine → citrulline"], ["What splits arginine, and into what?", "arginase;ornithine"], ["Where do the two nitrogens of urea come from?", "aspartate"]],
    [["What leftover goes to the Krebs cycle, and what comes back?", "fumarate;krebs cycle"]],
    [["What happens if any enzyme of the cycle is missing?", "hyperammonemia"]]
  ],
  10: [
    [["Phenylalanine becomes what, and which enzyme does it?", "phenylalanine → tyrosine;pah"], ["What does it end up as at the end of the line?", "fumarate + acetoacetate"], ["What's the side branch?", "melanin"]],
    [["If one enzyme stops, where does the backed-up stuff go?", "piles up;backs up"], ["Which enzyme is missing in PKU, and what piles up?", "pah missing;phenylalanine"], ["What's weird about the urine?", "mousy"], ["What happens to the brain, and how do you treat it?", "brain damage;low-phenylalanine diet"]],
    [["Which disease makes urine go black when it stands, and which enzyme is missing?", "homogentisate dioxygenase;alkaptonuria;black"], ["What's missing in albinism?", "tyrosinase;albinism"], ["Blocks further down the line cause which family of diseases?", "tyrosinemias"]]
  ],
  11: [
    [["What two molecules does heme start from?", "glycine + succinyl-coa"], ["Which enzyme makes the first product, and what is it?", "ala synthase;ala"], ["What's built in the middle?", "ring;porphyrin"], ["What's put in at the very end, and by which enzyme?", "ferrochelatase;iron;heme"]],
    [["Which step is the slow one, the boss?", "slow step"], ["What switches it off when there's enough heme?", "heme switches ala synthase off"]],
    [["Name things that switch heme synthesis on.", "low heme;barbiturates;low oxygen"]]
  ],
  12: [
    [["What is a porphyria, in one line? Why does stuff pile up?", "porphyria;heme synthesis;before it piles up"]],
    [["If the block is early, what piles up and what are the symptoms?", "early block;ala/pbg;belly pain"], ["If the block is late, what piles up and where does it go?", "late block;porphyrins;skin"], ["What happens in sunlight? What glows?", "burns in sunlight;red glowing"]],
    [["Which porphyria comes from PBG deaminase?", "pbg deaminase"], ["Why are porphyrias linked to vampire legends?", "vampire"]]
  ],
  13: [
    [["Why is free iron dangerous, and how is it always kept?", "radicals;bodyguard;always bound"], ["Where is iron absorbed? What happens to it first?", "duodenum;fe3+ → fe2+"], ["What's the way into the gut cell, and the way out?", "dmt1;ferroportin"]],
    [["What carries iron in the blood?", "transferrin"]],
    [["Where is iron stored?", "ferritin"], ["How does the body get rid of extra iron?", "no way to excrete;bleeding"]],
    [["Which hormone controls absorption, and what does it destroy?", "hepcidin;destroys ferroportin;less iron gets in"]],
    [["What do the red cells and ferritin look like in iron-deficiency anemia?", "iron-deficiency anemia;small pale"], ["Common causes?", "periods or gut bleeding"], ["What happens in hemochromatosis?", "hemochromatosis;liver, pancreas"]]
  ],
  14: [
    [["How long do red cells live, and where are they broken down?", "red cells (120 days);spleen"], ["Heme is broken into two coloured things in order. What are they?", "heme;biliverdin;bilirubin;green then yellow"]],
    [["Is that first bilirubin water-soluble? What does it ride on?", "unconjugated;not water-soluble;albumin"], ["What happens when there's too much? And way too much?", "jaundice;kernicterus"]],
    [["What does the liver do to bilirubin, and with which enzyme?", "liver;ugt;two glucuronic acids"], ["What does that change about it, and where does it go?", "conjugated;water-soluble;bile"]]
  ],
  15: [
    [["Which pump moves bilirubin into bile, and why is that step special?", "conjugated bilirubin into bile;mrp-2;slowest step"], ["What disease is it when that pump is broken?", "dubin-johnson"]],
    [["What do gut bacteria turn it into?", "gut;bacteria;urobilinogen → stercobilin"], ["Why is stool brown?", "brown"]],
    [["How does a little bit end up in urine?", "urobilinogen;urine"], ["So what's in normal urine and what isn't?", "a trace of urobilinogen"]]
  ],
  16: [
    [["Which kind of bilirubin can come out in urine, and why?", "only conjugated"]],
    [["Hemolytic: which bilirubin goes up?", "hemolytic;unconjugated up"], ["Is there bilirubin in the urine? What colour is the stool?", "no bilirubin in urine;dark stool"]],
    [["Hepatic: what goes up, and what's in the urine?", "hepatic;both up;bilirubin in urine"]],
    [["Obstructive: which bilirubin goes up?", "obstructive;conjugated up"], ["What colour are the urine and the stool, and why?", "dark urine;pale stool;no urobilinogen"]],
    [["Why do newborns get jaundice? How is it treated?", "newborn jaundice;immature;blue light"]],
    [["Name the inherited ones. Which is mild?", "gilbert;crigler-najjar;dubin-johnson"]]
  ],
  17: [
    [["What is the purine ring built on? What's that molecule called?", "first;ribose-5-phosphate → prpp"], ["Which enzyme does the committed step?", "amidotransferase;committed step"], ["Who adds the atoms to the ring?", "glycine, glutamine"], ["What is the first finished purine, and what two does it become?", "imp;amp or gmp"]],
    [["How do the end products control the pathway?", "stop new building;switch off the early steps"], ["What does salvage do, and which enzyme?", "salvage (hgprt)"], ["What happens when the brakes fail?", "too many purines"]]
  ],
  18: [
    [["What's the end product of purine breakdown, and which enzyme makes it?", "amp and gmp → xanthine → uric acid;xanthine oxidase"]],
    [["Why does too much uric acid cause gout? Where?", "doesn't dissolve;crystals in the joints;gout;big toe"], ["What drug treats it, and how does it work?", "allopurinol"]],
    [["Which enzyme is missing in Lesch-Nyhan, and what are the signs?", "lesch-nyhan;no hgprt;gout + brain damage"]],
    [["Which missing enzyme causes SCID?", "adenosine deaminase;scid"]]
  ],
  19: [
    [["Why does DNA need different nucleotides from RNA?", "deoxy;dna"], ["Which enzyme takes the oxygen off, from what?", "ribonucleotide reductase;ndps"], ["What does it use for electrons?", "thioredoxin;nadph"]],
    [["Why is it controlled, and what turns it on and off?", "all four are made evenly;atp turns it on"]],
    [["How is thymine made from uracil, and what vitamin does it need?", "thymine;thymidylate synthase;dump → dtmp;folate"], ["Which two drugs block this, and why does that stop cancer?", "methotrexate;5-fluorouracil;no dna;cancer cells stop"]]
  ],
  20: [
    [["Pyrimidines: ring first or sugar first?", "hull first;ring first"], ["Which enzyme starts it, and what does it make?", "cps ii;carbamoyl phosphate"], ["What's the order of the main molecules up to UMP?", "+ aspartate;orotate;prpp;ump"]],
    [["What builds up in orotic aciduria, and where does it end up?", "orotic aciduria;orotic acid;spills into the urine;leaks out"], ["What are the symptoms, and what's the treatment?", "anemia, poor growth;uridine"]],
    [["Why don't pyrimidines cause gout like purines do?", "water-soluble;no crystals"]]
  ]
};
