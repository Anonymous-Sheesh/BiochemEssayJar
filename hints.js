/* On call hints: casual questions she can send when he's missed something.
   They point at the IDEA he forgot (the why / what it does), not the word, so he works it out.
   One list per part of each essay, in the same order as the story. */
window.CALL_HINTS = {
  1: [
    ["Can the mouth actually cut protein? Why not?", "What does the acid in the stomach do to the protein's shape?", "Why is pepsin made switched off first, and what switches it on?", "Does pepsin cut at the ends or in the middle? So what comes out?"],
    ["What neutralises the acid when it reaches the duodenum?", "Who switches on the first pancreatic enzyme, and what does that one do to the others?", "Who finishes the job right on the gut wall, and what's left at the end?"],
    ["How do amino acids get into the gut cell: alone or with something?", "Where do they go after the gut cell?"],
    ["What happens to most of the amino acids in the liver?", "What happens to the nitrogen of the rest, and how does it leave the body?", "And the carbon part that's left?"]
  ],
  2: [
    ["Are body proteins kept forever? What's that called?", "What happens to most of the amino acids after a protein is broken down?", "Two reasons a protein gets destroyed?"],
    ["What's special about the inside of a lysosome, and what keeps it that way?", "Which enzymes are inside?", "Three ways stuff gets into it?"],
    ["What's the tag that marks a protein for death?", "E1, E2, E3: who does what, and which one decides who gets it?", "One tag isn't enough. What forms?", "What machine reads the tags, what does it need, and what comes out?"]
  ],
  3: [
    ["What exactly gets swapped in transamination, and onto what?", "Which vitamin has to be there for it?", "Can it go backwards? What does that let the body make?", "Who ends up holding everyone's nitrogen?"],
    ["Alanine swaps its amino group and becomes what?", "Which organ is ALT a marker for, and when does it go really high?"],
    ["Aspartate swaps its amino group and becomes what?", "Which organ is AST famous for? Which disease?"],
    ["What happens to the nitrogen on glutamate at the end? What's the combo called?"]
  ],
  4: [
    ["What is deamination, in one sentence?", "Where do the amino acid oxidases work, and can they go backwards?", "What toxic mess do they leave, and who cleans it?"],
    ["Which enzyme is the main one, and where is it?", "What's special about GDH compared to the oxidases?", "What turns GDH on and what turns it off? Why does that make sense?"],
    ["Transdeamination is two enzymes in a row. Which two, and in what order?"],
    ["Which vitamin do the non-oxidative ones need?", "What does serine become? And cysteine?"]
  ],
  5: [
    ["What amino acid is serotonin made from?", "Two steps: what's added first, what's removed second?", "Why does eating more tryptophan give more serotonin?"],
    ["Where is most of the serotonin actually stored?", "What does it do in the brain? Which drugs target it?", "What does it do to blood vessels?", "Which enzyme breaks it down?"],
    ["Where is melatonin made?", "What two groups get added to serotonin to make melatonin?"],
    ["What switches melatonin on, so when is it high?", "What does melatonin do to sleep and to sex drive?", "So what's it used for as a drug?"]
  ],
  6: [
    ["What amino acid do all three come from?", "Which step is the slow one, the one that controls everything?", "Put them in order: DOPA, dopamine, norepinephrine, epinephrine. What comes from what?"],
    ["Where in the brain is dopamine the main transmitter?", "Which one do sympathetic nerves actually release?", "Where does epinephrine come from, and how does it travel?"],
    ["Which two enzymes break them down?", "What's the end product of dopamine? And of the other two?"],
    ["Which neurons die in Parkinson's?", "What are the main symptoms?", "Why give L-DOPA instead of dopamine? Why add carbidopa?"]
  ],
  7: [
    ["Where does ammonia come from? Name two sources."],
    ["Who normally clears ammonia from the blood?", "What goes wrong in cirrhosis to make ammonia rise?"],
    ["Ammonia steals something from the Krebs cycle. What, and what happens to energy?", "It also uses up glutamate. Why does that matter for brakes in the brain?", "What symptoms does it cause?"]
  ],
  8: [
    ["Why can't ammonia travel raw in the blood?", "First way to pack it: which enzyme, running which way, makes what?"],
    ["Second, safer pack: what's it called and what does it cost?", "What's the main safe carrier of ammonia in blood?", "When it arrives at the kidney, what happens? And at the liver?"],
    ["How does muscle send its nitrogen to the liver?", "What does the liver send back to muscle?"]
  ],
  9: [
    ["What does the urea cycle turn into what?", "Which enzyme starts it, and what does it need to switch on?", "Where do the two nitrogens of urea come from?", "Which molecule keeps going round the cycle?"],
    ["What leftover goes to the Krebs cycle, and what comes back?"],
    ["What happens if any enzyme of the cycle is missing?"]
  ],
  10: [
    ["Phenylalanine becomes what, and which enzyme does it?", "What does tyrosine end up as at the end of the line? What's the side branch?"],
    ["Which enzyme is missing in PKU, and what piles up?", "What's weird about the urine?", "What happens to the brain, and how do you treat it?"],
    ["Which disease makes urine go black when it stands?", "What's missing in albinism?", "Blocks further down the line cause which family of diseases?"]
  ],
  11: [
    ["What two molecules does heme start from?", "Which enzyme makes the first product, ALA?", "What's built in the middle, and what's put in at the very end?"],
    ["Which enzyme is the boss of heme synthesis?", "What switches it off when there's enough heme?"],
    ["Name things that switch heme synthesis on."]
  ],
  12: [
    ["What is a porphyria, in one line?", "Why does stuff pile up?"],
    ["If the block is early, what piles up and what are the symptoms?", "If the block is late, what piles up and what happens in sunlight?"],
    ["Which porphyria comes from PBG deaminase?", "Why are porphyrias linked to vampire legends?"]
  ],
  13: [
    ["Why is free iron dangerous?", "Where is iron absorbed? What's the way in and the way out of the gut cell?"],
    ["What carries iron in the blood?"],
    ["Where is iron stored?", "How does the body get rid of extra iron?"],
    ["Which hormone controls absorption, and what does it destroy?", "What happens to it when iron is low?"],
    ["What do the red cells and ferritin look like in iron-deficiency anemia? Common causes?", "What happens in hemochromatosis?"]
  ],
  14: [
    ["How long do red cells live, and where are they broken down?", "Heme is broken into two coloured things in order. What are they?"],
    ["Is that first bilirubin water-soluble? What does it ride on?", "What happens when there's too much? And way too much?"],
    ["What does the liver do to bilirubin, and with which enzyme?", "What does that change about it?"]
  ],
  15: [
    ["Which pump moves bilirubin into bile, and why is that step special?", "What disease is it when that pump is broken?"],
    ["What do gut bacteria turn it into?", "Why is stool brown?"],
    ["How does a little bit end up in urine?", "So what's in normal urine and what isn't?"]
  ],
  16: [
    ["Which kind of bilirubin can come out in urine, and why?"],
    ["Hemolytic: which bilirubin goes up? Is there bilirubin in the urine? What colour is the stool?"],
    ["Hepatic: what goes up, and what's in the urine?"],
    ["Obstructive: what colour are the urine and the stool, and why?"],
    ["Why do newborns get jaundice? How is it treated?"],
    ["Name the inherited ones. Which is mild?"]
  ],
  17: [
    ["What is the purine ring built on? What's that molecule called?", "Which step is the committed one?", "What is the first finished purine, and what two does it become?"],
    ["How do the end products control the pathway?", "What does salvage do, and which enzyme?", "What happens when the brakes fail?"]
  ],
  18: [
    ["What's the end product of purine breakdown, and which enzyme makes it?"],
    ["Why does too much uric acid cause gout?", "What drug treats it, and how does it work?"],
    ["Which enzyme is missing in Lesch-Nyhan, who gets it, and what are the signs?"],
    ["Which missing enzyme causes SCID?"]
  ],
  19: [
    ["Why does DNA need different nucleotides from RNA?", "Which enzyme takes the oxygen off, and what does it use?"],
    ["What turns that enzyme on and what turns it off? Why does that matter?"],
    ["How is thymine made from uracil, and what vitamin does it need?", "Which two drugs block this, and why does that stop cancer?"]
  ],
  20: [
    ["Pyrimidines: ring first or sugar first?", "Which enzyme starts it, and where?", "What's the order of the main molecules up to UMP?"],
    ["What builds up in orotic aciduria, and where does it end up?", "What are the symptoms, and what's the treatment?"],
    ["Why don't pyrimidines cause gout like purines do?"]
  ]
};
