/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");

for (const line of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}

const apply = process.argv.includes("--apply");
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const sources = {
  merck: { title: "Management of Aquarium Fish", publisher: "Merck Veterinary Manual", url: "https://www.merckvetmanual.com/exotic-and-laboratory-animals/aquarium-fish/management-of-aquarium-fish", source_type: "website" },
  ufResponsible: { title: "The Ornamental Fish Trade: An Introduction with Perspectives for Responsible Aquarium Fish Ownership", publisher: "University of Florida IFAS Extension", url: "https://edis.ifas.ufl.edu/publication/FA124", source_type: "organization" },
  ufAmmonia: { title: "Ammonia", publisher: "University of Florida IFAS Extension", url: "https://edis.ifas.ufl.edu/publication/FA031", source_type: "organization" },
  cdc: { title: "Fish: Healthy Pets, Healthy People", publisher: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/healthy-pets/about/fish.html", source_type: "organization" },
};

const articles = [
  {
    title: "How to Cycle a Freshwater Aquarium Without Sacrificing Fish",
    slug: "how-to-cycle-a-freshwater-aquarium",
    summary: "A test-driven explanation of freshwater aquarium cycling, what ammonia and nitrite results mean, and how to decide when a new tank is actually ready for livestock.",
    seoTitle: "How to Cycle a Freshwater Aquarium: A Test-Driven Guide",
    metaDescription: "Learn how fishless aquarium cycling works, how to test ammonia, nitrite, and nitrate, and how to know when a freshwater tank is ready for fish.",
    category: "aquarium-setup-planning",
    relatedCareGuides: ["betta-splendens", "guppy", "celestial-pearl-danio"],
    sourceKeys: ["merck", "ufAmmonia", "ufResponsible", "cdc"],
    sections: [
      ["paragraph", { text: "Cycling a freshwater aquarium means establishing a working biological filter before asking fish to live with the waste they produce. Fish release ammonia through normal metabolism, and decomposing food and organic debris add more. In an established system, microorganisms convert ammonia to nitrite and then convert nitrite to the less toxic nitrate that aquarists manage with water changes, plants, and sensible feeding. A new filter does not perform that job simply because water has circulated through it for several days. The only reliable way to judge progress is to provide an ammonia source and follow the results with water tests." }],
      ["heading", { text: "Why fishless cycling is the safer default", level: 2 }],
      ["paragraph", { text: "A fish-in cycle exposes livestock to the very compounds the aquarist is trying to control. Even when fish survive, survival is not proof that the process was harmless. Fishless cycling separates filter preparation from animal welfare: the tank, heater, and filter can run while an ammonia source feeds the developing biofilter, but no fish is present during the unstable period. The Merck Veterinary Manual notes that new-tank syndrome commonly appears during the first six weeks and that a tropical biofilter may take as long as eight weeks to establish. Those figures are context, not a countdown. Temperature, alkalinity, inoculation, surface area, and maintenance all affect the pace, so testing matters more than a calendar date." }],
      ["heading", { text: "Equipment and tests to have before starting", level: 2 }],
      ["list", { ordered: false, items: ["The aquarium, filter, appropriate heater, thermometer, and dechlorinator", "A dependable ammonia source intended for fishless cycling or a measured alternative", "Tests for ammonia, nitrite, nitrate, and pH", "A notebook or spreadsheet for dates, doses, and test results", "A plan for the adult livestock rather than only the first fish purchase"] }],
      ["paragraph", { text: "Use the filter media and equipment that will remain on the aquarium. Chlorine or chloramine must be treated because disinfected tap water can harm both livestock and the organisms being cultivated in the filter. Maintain the temperature and pH appropriate for the future stocking plan rather than cycling under one set of conditions and radically changing them at the end. Never mix cleaners, medications, or household ammonia products containing fragrances or surfactants into the aquarium." }],
      ["heading", { text: "A practical fishless-cycling sequence", level: 2 }],
      ["list", { ordered: true, items: ["Set up the complete aquarium, treat the water, start the filter, and confirm stable temperature.", "Add the chosen ammonia source conservatively and record the measured result instead of relying only on the amount poured.", "Test ammonia and nitrite regularly. Early in the process ammonia remains detectable; later, nitrite commonly rises as ammonia begins to fall.", "Continue supplying a controlled ammonia source so the developing biofilter is not starved, but do not keep adding blindly when concentrations are already high.", "Track nitrate as supporting evidence while remembering that tap water, plants, and water changes can affect its reading.", "When the system can process a measured ammonia input without leaving detectable ammonia or nitrite by the next test interval, perform the appropriate water change and reconfirm the result before stocking.", "Add livestock according to the planned biological load rather than filling every intended space on the first day."] }],
      ["heading", { text: "How to read the three nitrogen tests", level: 2 }],
      ["comparison_table", { headers: ["Result", "What it suggests", "What to do"], rows: [["Ammonia present", "Waste is entering faster than the current biofilter can process it", "Do not add fish; continue monitoring and correct any excessive dose"], ["Nitrite present", "The first conversion is occurring, but the second stage is not keeping up", "Wait and continue controlled cycling"], ["Nitrate rising", "Nitrogen is reaching the later stage of the cycle", "Use it as supporting evidence, not the only completion test"], ["Ammonia and nitrite both clear after a measured input", "The biofilter is processing the test load", "Confirm the result, reduce nitrate as needed, then stock gradually"]] }],
      ["heading", { text: "Common reasons a cycle appears stalled", level: 2 }],
      ["paragraph", { text: "An apparent stall is often a measurement or process problem. A test may be expired or read under poor lighting. Untreated disinfectant may be suppressing microorganisms. Very low alkalinity can allow pH to fall far enough to slow biofiltration. An oversized ammonia dose can create conditions unlike the future aquarium. Replacing all filter media discards much of the colonized surface, while rinsing it under chlorinated tap water can damage it. Diagnose the actual variable before buying a bottled remedy or repeatedly restarting the tank." }],
      ["warning", { text: "A nitrate reading by itself does not prove an aquarium is ready. The completion check is whether the operating aquarium can repeatedly process the planned test load without leaving detectable ammonia or nitrite. Follow the directions and limitations of the specific test kit you use." }],
      ["heading", { text: "The first month after stocking", level: 2 }],
      ["paragraph", { text: "Cycling creates capacity for a starting load; it does not make the aquarium maintenance-free. Feed lightly enough that food is eaten, watch every fish for respiratory distress or unusual inactivity, and continue testing after stocking. A dead animal, hidden food, a power outage, medication, or a sudden increase in livestock can push waste production beyond the established capacity. Preserve filter media during cleaning, remove debris, and use water changes to control dissolved waste. Topping off evaporated water replaces water but does not remove nitrate or accumulated minerals." }],
      ["heading", { text: "When is the aquarium ready?", level: 2 }],
      ["paragraph", { text: "The aquarium is ready for its initial planned stocking only when the equipment is stable, the future water conditions are appropriate, and repeated testing shows that the biological filter processes the test input without detectable ammonia or nitrite afterward. The livestock plan must still fit the tank’s dimensions, adult sizes, social groups, activity levels, and compatibility. Cycling answers whether the filter can process nitrogenous waste; it does not answer whether two fish can safely share space." }],
      ["faq_group", { items: [{ question: "How many days does aquarium cycling take?", answer: "There is no honest universal day count. A new tropical biofilter may take several weeks and sometimes longer. Test results, not elapsed time, determine readiness." }, { question: "Can established filter media speed up cycling?", answer: "Healthy mature media can introduce an active microbial community, but it can also transfer pathogens or pests if its source tank is not healthy. Continue testing even when seeded media is used." }, { question: "Does cloudy water mean the cycle is complete?", answer: "No. Cloudiness can have several causes and is not a substitute for ammonia, nitrite, nitrate, pH, and equipment checks." }] }],
    ],
  },
  {
    title: "How to Plan a Freshwater Community Tank Before Buying Fish",
    slug: "how-to-plan-a-freshwater-community-tank",
    summary: "A practical stocking workflow that starts with adult size, social groups, water conditions, swimming zones, behavior, filtration, and a realistic maintenance plan.",
    seoTitle: "How to Plan a Freshwater Community Tank Stocking List",
    metaDescription: "Build a safer freshwater community stocking plan using adult size, group requirements, water overlap, behavior, tank dimensions, and filtration.",
    category: "stocking-compatibility",
    relatedCareGuides: ["guppy", "celestial-pearl-danio", "bristlenose-pleco"],
    sourceKeys: ["ufResponsible", "cdc", "merck"],
    sections: [
      ["paragraph", { text: "A good community aquarium is designed backward from the adult animals, not assembled one attractive juvenile at a time. Every candidate contributes more than an inch of body length: it has a temperature range, water-chemistry preference, activity level, social requirement, feeding strategy, territorial pattern, waste load, and adult shape. The tank must satisfy the complete group at the same time. Compatibility is therefore a set of overlapping constraints, not a label attached to one species." }],
      ["heading", { text: "Start with the aquarium’s fixed limits", level: 2 }],
      ["paragraph", { text: "Record the actual aquarium dimensions and water volume after substrate and hardscape are considered. Long, active swimmers benefit from horizontal distance; tall-bodied fish need vertical clearance; bottom groups compete for floor area even when open water remains above them. Confirm the filter’s operating needs, heater capacity, lid, flow pattern, and available electrical backup. Test the source water so the plan begins near conditions you can maintain consistently. Chasing an extreme pH with repeated chemical adjustments is usually less stable than choosing livestock suited to the available water." }],
      ["heading", { text: "Choose a focal requirement, not a shopping list", level: 2 }],
      ["paragraph", { text: "Begin with one species or one clear habitat goal. If the focal fish requires warm, soft water, every later candidate must fit that window. If it is a fast schooling fish, the aquarium needs adequate horizontal room and companions that tolerate the activity. If it is territorial, the plan must reserve defensible space and sight breaks. Starting with a constraint makes decisions easier because unsuitable options can be rejected early instead of rationalized after purchase." }],
      ["heading", { text: "Count complete social groups", level: 2 }],
      ["paragraph", { text: "Schooling and shoaling fish should be budgeted as groups from the beginning. A plan that has room for two corydoras but not an appropriate group does not truly have room for corydoras. The same principle applies to fish whose sex ratio affects harassment or reproduction. Livebearers may create an additional population plan: mixed-sex groups can produce fry, while poorly chosen ratios can concentrate attention on too few females. Social needs consume space and biological capacity before decorative variety is considered." }],
      ["comparison_table", { headers: ["Planning factor", "Question to answer", "Frequent mistake"], rows: [["Adult size", "How large and what shape will every fish become?", "Using store size as the final size"], ["Social group", "How many of the same species are needed?", "Buying token pairs of schooling fish"], ["Water overlap", "Is there a stable shared temperature and chemistry window?", "Aiming at opposite tolerance limits"], ["Behavior", "Who chases, guards, nips, hides, or hunts?", "Treating peaceful as a guarantee"], ["Tank zone", "Is each swimming and resting zone crowded?", "Assuming unused upper water creates more bottom space"], ["Biological load", "Can filtration and maintenance manage the complete group?", "Using a single inches-per-gallon shortcut"]] }],
      ["heading", { text: "Use water ranges as an intersection", level: 2 }],
      ["paragraph", { text: "Two species are not a sound match merely because each can survive at one shared boundary value. Look for a practical overlap that leaves room for normal variation and supports long-term care. Temperature affects metabolism and dissolved oxygen, while pH, hardness, and alkalinity influence physiological stress and system stability. Keep the aquarium inside the shared recommended range rather than averaging incompatible requirements. When structured records are incomplete or sources disagree, treat uncertainty as a reason for more research, not permission to assume compatibility." }],
      ["heading", { text: "Check predation, aggression, and fin risk separately", level: 2 }],
      ["paragraph", { text: "Temperament labels compress complicated behavior. A fish called peaceful may still eat animals small enough to swallow, defend a cave, harass its own species, or outcompete slower fish at feeding time. Compare mouth and body size, adult size differences, activity, fin shape, territorial zones, breeding behavior, and known nipping tendencies. Then design cover and sight breaks without removing needed swimming area. A larger tank can reduce some conflicts, but volume does not erase a predator-prey relationship or incompatible social behavior." }],
      ["heading", { text: "Plan feeding before stocking", level: 2 }],
      ["paragraph", { text: "Community fish can share water while failing to share food fairly. Surface feeders may finish food before it reaches bottom dwellers. Shy fish may remain hidden while active fish monopolize every feeding. Algae grazers and detritus feeders still need a complete diet; they are not powered by aquarium dirt. Write down what each species eats, where it feeds, how often it should be observed eating, and how uneaten food will be controlled. Feeding access is part of compatibility because chronic underfeeding and excess waste both create health problems." }],
      ["heading", { text: "Add livestock in deliberate stages", level: 2 }],
      ["list", { ordered: true, items: ["Finish cycling and confirm stable water before the first purchase.", "Quarantine new arrivals with separate equipment.", "Add one planned social group or modest load rather than the complete final list.", "Observe feeding, respiration, hiding, chasing, and water tests before the next addition.", "Recalculate the remaining plan after any substitution; one different species can change temperature, space, and behavior constraints.", "Stop stocking before the tank reaches a theoretical maximum so routine maintenance and unexpected growth remain manageable."] }],
      ["warning", { text: "Do not use one inch of fish per gallon as a complete stocking rule. It ignores adult body mass, tank dimensions, social groups, activity, waste production, territorial behavior, filtration, and species compatibility." }],
      ["heading", { text: "A maintenance plan is part of stocking", level: 2 }],
      ["paragraph", { text: "A stocking list is only realistic if the keeper can maintain it. Estimate the time and water needed for regular changes, substrate cleaning where appropriate, plant care, filter maintenance, testing, and observation. Identify who can care for the aquarium during travel and what happens during a prolonged power outage. The strongest plan is not the list with the most species; it is the one that remains stable during ordinary life and makes abnormal behavior easy to notice." }],
      ["faq_group", { items: [{ question: "How many species should a community aquarium contain?", answer: "There is no universal number. Prioritize complete social groups and compatible requirements over variety. A tank with fewer well-supported species is usually easier to observe and maintain." }, { question: "Does a larger aquarium make every pair compatible?", answer: "No. More space can help with dilution and some territorial behavior, but it cannot correct incompatible temperatures, predation, severe aggression, or unsuitable social structure." }, { question: "Should bottom dwellers count toward stocking?", answer: "Yes. Every animal contributes waste and uses physical space, oxygen, feeding access, and maintenance capacity regardless of its swimming zone." }] }],
    ],
  },
  {
    title: "A Practical Quarantine Routine for New Freshwater Fish",
    slug: "freshwater-fish-quarantine-routine",
    summary: "How to prepare and operate a simple quarantine aquarium, observe new fish, prevent cross-contamination, and decide when an animal is ready for the display tank.",
    seoTitle: "Freshwater Fish Quarantine: Setup, Routine, and Checklist",
    metaDescription: "Set up a practical freshwater fish quarantine tank, prevent cross-contamination, monitor new arrivals, and protect an established aquarium.",
    category: "fish-care-species",
    relatedCareGuides: ["betta-splendens", "guppy", "bristlenose-pleco"],
    sourceKeys: ["merck", "ufResponsible", "cdc"],
    sections: [
      ["paragraph", { text: "Quarantine is a period of separation and observation before a new fish joins an established aquarium. Its purpose is not to prove that an animal carries nothing; no home routine can detect every pathogen. It creates time to notice external parasites, abnormal behavior, feeding problems, injuries, and water-quality issues without immediately exposing the display tank. It also gives a stressed arrival a simpler environment where the keeper can observe eating and waste closely." }],
      ["heading", { text: "What a quarantine tank needs", level: 2 }],
      ["list", { ordered: false, items: ["A covered aquarium sized for the species and number being quarantined", "A cycled filter or healthy mature sponge filter reserved for quarantine use", "Appropriate heat, aeration, thermometer, and treated water", "Simple shelters that can be cleaned and that still allow observation", "Dedicated net, siphon, bucket, and other wet equipment", "Tests for ammonia, nitrite, nitrate, and the relevant source-water parameters", "A written log for arrival, behavior, feeding, test results, and any treatment"] }],
      ["paragraph", { text: "Bare-bottom tanks are often practical because waste and uneaten food are visible, but the setup still has to meet the animal’s needs. A frightened fish may require opaque sides or simple cover. A bottom-dwelling species may need an appropriate temporary surface. Strong swimmers need enough length, and labyrinth fish still need safe surface access. Quarantine should simplify care, not become an excuse for cramped or unsuitable housing." }],
      ["heading", { text: "Cycle the quarantine filter before the fish arrives", level: 2 }],
      ["paragraph", { text: "A new container with an uncycled filter can create new-tank syndrome while the keeper is watching for disease. One practical approach is to keep an extra sponge filter running in a known healthy aquarium, then move it to the quarantine tank when needed. Do not seed from an aquarium with unexplained illness, and do not move the used quarantine filter back into the display system without an appropriate disinfection and reset process. Continue testing after arrival because transport stress, feeding, medication, and the size of the incoming group can exceed the filter’s capacity." }],
      ["heading", { text: "Receiving and acclimating the fish", level: 2 }],
      ["paragraph", { text: "Prepare the quarantine tank before bringing livestock home. Reduce unnecessary light and verify temperature and equipment. Inspect the transport bag for dead animals, severe distress, leaks, or fouled water. Acclimation should address meaningful temperature and water differences without leaving fish in a small shipping volume longer than necessary. Methods vary with the shipment and species, so follow qualified supplier or veterinary guidance rather than treating one internet ritual as universal. Do not pour store water into the display aquarium." }],
      ["heading", { text: "A daily observation routine", level: 2 }],
      ["comparison_table", { headers: ["Check", "What to record", "Why it matters"], rows: [["Water", "Temperature, ammonia, nitrite, and any relevant chemistry", "Water-quality injury can resemble infectious disease"], ["Respiration", "Rate, surface gasping, one-sided gill movement", "Changes may signal stress, poor oxygen, gill disease, or toxins"], ["Body and fins", "Spots, excess mucus, ulcers, swelling, torn fins, color change", "A dated description reveals progression"], ["Behavior", "Balance, swimming, hiding, flashing, isolation, aggression", "Departure from the fish’s normal pattern is informative"], ["Feeding", "Food offered, amount eaten, who did not eat", "Appetite and access are useful health indicators"], ["Waste", "Appearance and frequency where visible", "Supports the complete observation record"]] }],
      ["paragraph", { text: "Observe before disturbing the tank. Fish often change behavior when a person approaches, lights switch on, or food appears. Record the conditions rather than writing only ‘looks fine.’ A dated log helps distinguish a one-time stress response from a trend and gives a veterinarian more useful information if professional help is needed." }],
      ["heading", { text: "Prevent cross-contamination", level: 2 }],
      ["paragraph", { text: "Quarantine fails when water and equipment move freely between systems. Use dedicated nets, siphons, buckets, towels, and test accessories. Work on the established display aquarium before handling quarantine, then wash hands and clean any shared work area. Avoid splashing water, and do not share filter media during the observation period. Merck’s veterinary guidance recommends that quarantined animals have designated equipment and be handled after other animals for the day. The same direction of work is useful in a home fish room." }],
      ["heading", { text: "Do not medicate automatically", level: 2 }],
      ["paragraph", { text: "Medication is not a substitute for diagnosis, clean water, or observation. Products have different target organisms, safety margins, interactions, and effects on biological filtration. An unnecessary treatment can stress the fish, obscure symptoms, or expose pathogens to an ineffective dose. If a fish becomes ill, first verify water quality and review its history and signs. Seek an aquatic veterinarian or qualified fish-health professional when disease is severe, spreading, unexplained, or not responding to appropriate husbandry." }],
      ["warning", { text: "Never move a sick fish, quarantine water, wet equipment, or unverified filter media into the display aquarium to solve a quarantine problem. Separation is the main protection the process provides." }],
      ["heading", { text: "How long should quarantine last?", level: 2 }],
      ["paragraph", { text: "The Merck Veterinary Manual describes 30 days as a minimum quarantine period for pet fish and notes that longer periods may be needed. Count only a stable observation period, not days spent managing unexplained illness or toxic water. The appropriate duration can depend on species, source, temperature, symptoms, diagnostic findings, and exposure history. If treatment is required, the post-treatment observation plan should be based on the problem and professional guidance rather than the original purchase date." }],
      ["heading", { text: "Transfer checklist", level: 2 }],
      ["list", { ordered: true, items: ["The planned observation period is complete and documented.", "The fish is behaving normally for its species and eating reliably.", "No unexplained lesions, respiratory signs, abnormal waste, or progressive symptoms remain.", "Ammonia and nitrite have stayed controlled and the fish has not merely endured poor water.", "The display tank matches the species’ temperature, chemistry, group, space, and compatibility needs.", "A clean transfer tool and acclimation plan are ready; quarantine water will not enter the display."] }],
      ["heading", { text: "After quarantine", level: 2 }],
      ["paragraph", { text: "Observe the display tank closely after transfer because social stress and a new environment can reveal problems not visible in isolation. Clean and disinfect the quarantine setup using a method suitable for its materials, then store equipment dry or reset it for the next planned use. Preserve a separate, healthy source of cycled media rather than returning potentially exposed media to the display tank. Quarantine works best as a repeatable routine, not an emergency container assembled after symptoms appear." }],
      ["faq_group", { items: [{ question: "Can a bucket serve as a quarantine tank?", answer: "A temporary container may help during transport or an emergency, but routine quarantine needs adequate volume, filtration, heat where required, oxygenation, cover, and observation access for the species." }, { question: "Can quarantine guarantee a fish is disease-free?", answer: "No. It reduces risk and improves observation, but some infections can be inapparent or cannot be detected with nonlethal home methods." }, { question: "Can several new fish quarantine together?", answer: "They can share a suitable quarantine system when their requirements and source history support it, but the tank must accommodate the complete group and one exposed fish can expose the others." }] }],
    ],
  },
];

const expandedGuide = {
  id: "6586fba7-2bb9-4e31-a61c-2803692efc87",
  title: "Betta vs Guppy: Care, Tank Setup, and Compatibility Compared",
  summary: "A detailed comparison of Betta splendens and guppies covering adult size, social structure, water overlap, aquarium setup, feeding, reproduction, behavior, and the risks of keeping them together.",
  seoTitle: "Betta vs Guppy: Care and Compatibility Comparison",
  metaDescription: "Compare bettas and guppies by tank size, water parameters, temperament, social needs, feeding, reproduction, and compatibility before choosing either fish.",
  sections: [
    ["paragraph", { text: "Betta splendens and guppies are both colorful tropical fish, but they create very different aquariums. A betta is commonly planned as a solitary centerpiece whose long fins, territorial behavior, and preference for calmer flow shape the tank. Guppies are active social livebearers whose group structure, constant movement, and reproduction must be planned before purchase. Neither is automatically better. The right choice depends on whether the keeper wants one highly visible fish or an active group and whether the aquarium can support the adult behavior rather than the store display." }],
    ["heading", { text: "Betta and guppy requirements at a glance", level: 2 }],
    ["comparison_table", { headers: ["Factor", "Betta splendens", "Guppy"], rows: [["Social plan", "Usually one adult male housed without another male", "A planned social group with sex and reproduction considered"], ["Activity", "Deliberate exploration with regular surface access", "Continuous active swimming throughout open areas"], ["Water movement", "Generally benefits from gentler flow and resting areas", "Tolerates moderate community-tank circulation when not excessive"], ["Feeding", "Protein-focused omnivorous/carnivorous prepared diet", "Varied omnivorous diet offered in portions the group can finish"], ["Reproduction", "Specialized breeding behavior; not a casual community project", "Livebearer that can produce repeated broods in mixed-sex groups"], ["Main planning risk", "Territorial aggression and fin stress", "Overpopulation, harassment, and insufficient group planning"]] }],
    ["heading", { text: "Aquarium size and layout", level: 2 }],
    ["paragraph", { text: "For either fish, advertised minimum volume is only a starting constraint. A betta aquarium needs stable heated water, filtration that does not push the fish constantly, surface access, a secure lid, cover, and resting areas near the surface. Guppies use more open swimming room and should be budgeted as a group rather than as one small fish. A mixed-sex group also needs capacity for fry or a firm plan to prevent repeated population growth. In both cases, greater usable volume makes temperature and waste less volatile, but layout still matters." }],
    ["heading", { text: "Water parameters and stability", level: 2 }],
    ["paragraph", { text: "Both species are tropical, yet sharing a temperature label does not make their complete water preferences identical. Bettas are commonly maintained in warm, calm freshwater. Guppies generally perform well in warm water with dependable mineral content and stability. Choose a target inside the documented overlap for the exact stock being kept, then keep it stable. Avoid buying one fish whose preferred conditions sit at the other species’ tolerance edge. Cycling, dechlorination, regular testing, and water changes matter more than repeatedly adjusting pH to chase a number." }],
    ["heading", { text: "Behavior: the largest practical difference", level: 2 }],
    ["paragraph", { text: "A betta can investigate, flare, chase, or defend space, and individual behavior varies. Guppies are active and visually conspicuous; males may repeatedly display and pursue females, while long-finned strains can attract attention from a territorial fish. This creates risk in both directions: the betta may chase or injure guppies, while persistent guppy activity can keep a betta stressed and prevent calm feeding or rest. Plants and sight breaks help manage ordinary movement, but decoration cannot guarantee peace between incompatible individuals." }],
    ["heading", { text: "Social needs and reproduction", level: 2 }],
    ["paragraph", { text: "The simplest betta plan is often one adult male without another betta male. Guppies require a group plan. Keeping males and females together can produce frequent fry, and an unprepared keeper may move rapidly from a manageable aquarium to overcrowding. Sex ratios can influence harassment, but separating sexes or choosing an appropriate single-sex group may be more realistic when breeding is not intended. Count the complete guppy group and possible reproduction before comparing tank space with a solitary betta setup." }],
    ["heading", { text: "Feeding and daily observation", level: 2 }],
    ["paragraph", { text: "Feed both species a complete, appropriately sized diet rather than relying on one generic flake for every need. Bettas may feed deliberately at the surface and can be outcompeted by quick guppies. Guppies spread through the water column and may reach food first. In any shared experiment, the keeper must verify that each animal eats without chronic chasing. Uneaten food should not be added to compensate because it increases waste and can destabilize water quality." }],
    ["heading", { text: "Can a betta live with guppies?", level: 2 }],
    ["paragraph", { text: "This pairing is risky enough that it should not be treated as a default community recommendation. Long fins, bright colors, rapid movement, territorial responses, and individual variation can produce chasing, torn fins, hiding, missed meals, or chronic stress. A large, well-structured aquarium may reduce some pressure, but it does not remove the behavioral conflict. A keeper attempting the pair needs a cycled separate aquarium ready before introduction—not a divider or spare bowl found after aggression begins." }],
    ["warning", { text: "Do not buy guppies as experimental companions for a betta unless you can house either species separately for the rest of its life. Stop the attempt at persistent chasing, damaged fins, hiding, rapid breathing, loss of appetite, or blocked access to food and resting areas." }],
    ["heading", { text: "Which fish is better for a beginner?", level: 2 }],
    ["paragraph", { text: "A betta may suit someone who wants to focus on one fish and can provide a heated, filtered, gently flowing aquarium. Guppies may suit someone who wants an active community-style group and is prepared to manage social structure and reproduction. Neither fish excuses cycling or maintenance. Guppies are not easier if uncontrolled breeding overwhelms the tank, and a betta is not easier if it is kept in an unheated bowl. Choose the care routine you can sustain, then build the aquarium around it." }],
    ["heading", { text: "Decision checklist", level: 2 }],
    ["list", { ordered: false, items: ["Choose a betta if one centerpiece fish and gentle flow fit the intended aquarium.", "Choose guppies if an active group and its social or reproductive management fit the plan.", "Confirm the source water and stable temperature before choosing either species.", "Budget for adult group size, filtration, food, quarantine, and long-term care—not the purchase price.", "Use separate aquariums rather than forcing the species together when behavior is uncertain."] }],
    ["faq_group", { items: [{ question: "Are bettas or guppies easier to keep?", answer: "Both can be manageable when properly housed. A betta simplifies the social plan, while guppies introduce group and reproduction decisions. The easier option is the one whose complete needs match the keeper’s aquarium and routine." }, { question: "Will a betta always attack a guppy?", answer: "No individual outcome is guaranteed, but the combination presents meaningful risks from territorial behavior, bright long fins, and constant activity. It should not be assumed safe." }, { question: "Can guppies live in an unheated tank?", answer: "They need a stable temperature appropriate for their stock and should not be treated as a universal room-temperature fish. Measure the aquarium rather than relying on room temperature." }, { question: "Can a betta live alone?", answer: "A properly housed betta can be kept without fish companions. Solitary housing still requires enrichment, stable heated water, filtration, appropriate space, and daily observation." }] }],
  ],
};

function textFromContent(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textFromContent).join(" ");
  if (value && typeof value === "object") return Object.values(value).map(textFromContent).join(" ");
  return "";
}
function wordCount(sections) {
  return sections.map(([, content]) => textFromContent(content)).join(" ").trim().split(/\s+/).filter(Boolean).length;
}
async function required(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}
async function sourceIds(keys) {
  const ids = [];
  for (const key of keys) {
    const value = { ...sources[key], accessed_date: new Date().toISOString().slice(0, 10) };
    let row = await required(await supabase.from("sources").select("id").eq("url", value.url).maybeSingle(), `Find source ${key}`);
    if (!row) row = await required(await supabase.from("sources").insert(value).select("id").single(), `Create source ${key}`);
    ids.push(row.id);
  }
  return ids;
}
async function careGuideIds(slugs) {
  const rows = await required(await supabase.from("care_guides").select("id,slug").in("slug", slugs).eq("status", "published"), "Load related care guides");
  if (rows.length !== slugs.length) throw new Error(`Missing related care guide for ${slugs.join(", ")}`);
  return slugs.map((slug) => rows.find((row) => row.slug === slug).id);
}
async function categoryId(slug) {
  const row = await required(await supabase.from("article_categories").select("id").eq("slug", slug).single(), `Load category ${slug}`);
  return row.id;
}
async function publishArticle(article) {
  const count = wordCount(article.sections);
  if (count < 900) throw new Error(`${article.slug} has only ${count} words`);
  let row = await required(await supabase.from("articles").select("*").eq("slug", article.slug).maybeSingle(), `Find ${article.slug}`);
  if (row?.status === "published") {
    console.log(`SKIP published article ${article.slug} (${count} words)`);
    return row;
  }
  const values = { title: article.title, slug: article.slug, summary: article.summary, content_type: "article", status: "draft", seo_title: article.seoTitle, meta_description: article.metaDescription, canonical_url: `https://www.guidemytank.com/learning-center/${article.slug}`, is_featured: false };
  row = row ? await required(await supabase.from("articles").update(values).eq("id", row.id).select("*").single(), `Update ${article.slug}`) : await required(await supabase.from("articles").insert(values).select("*").single(), `Create ${article.slug}`);
  await required(await supabase.from("article_sections").delete().eq("article_id", row.id), `Reset sections ${article.slug}`);
  await required(await supabase.from("article_sections").insert(article.sections.map(([block_type, content], display_order) => ({ article_id: row.id, block_type, content, display_order }))), `Insert sections ${article.slug}`);
  const ids = await sourceIds(article.sourceKeys);
  await required(await supabase.from("article_sources").delete().eq("article_id", row.id), `Reset sources ${article.slug}`);
  await required(await supabase.from("article_sources").insert(ids.map((source_id, display_order) => ({ article_id: row.id, source_id, display_order }))), `Attach sources ${article.slug}`);
  await required(await supabase.from("article_category_assignments").delete().eq("article_id", row.id), `Reset category ${article.slug}`);
  await required(await supabase.from("article_category_assignments").insert({ article_id: row.id, category_id: await categoryId(article.category) }), `Attach category ${article.slug}`);
  const related = await careGuideIds(article.relatedCareGuides);
  await required(await supabase.from("article_related_care_guides").delete().eq("article_id", row.id), `Reset related guides ${article.slug}`);
  await required(await supabase.from("article_related_care_guides").insert(related.map((care_guide_id, display_order) => ({ article_id: row.id, care_guide_id, display_order, relationship_label: "Related care guide" }))), `Attach related guides ${article.slug}`);
  row = await required(await supabase.from("articles").update({ status: "published", published_at: new Date().toISOString() }).eq("id", row.id).select("*").single(), `Publish ${article.slug}`);
  console.log(`PUBLISHED ${article.slug}: ${count} words, ${article.sections.length} sections, ${ids.length} sources`);
  return row;
}
async function expandGuide() {
  const count = wordCount(expandedGuide.sections);
  if (count < 900) throw new Error(`Expanded guide has only ${count} words`);
  const row = await required(await supabase.from("articles").select("*").eq("id", expandedGuide.id).eq("content_type", "guide").single(), "Load Betta vs Guppy guide");
  await required(await supabase.from("articles").update({ status: "archived" }).eq("id", row.id), "Archive guide for editorial revision");
  await required(await supabase.from("article_sections").delete().eq("article_id", row.id), "Reset guide sections");
  await required(await supabase.from("article_sections").insert(expandedGuide.sections.map(([block_type, content], display_order) => ({ article_id: row.id, block_type, content, display_order }))), "Insert expanded guide sections");
  const ids = await sourceIds(["merck", "ufResponsible", "cdc"]);
  await required(await supabase.from("article_sources").delete().eq("article_id", row.id), "Reset guide sources");
  await required(await supabase.from("article_sources").insert(ids.map((source_id, display_order) => ({ article_id: row.id, source_id, display_order }))), "Attach guide sources");
  await required(await supabase.from("article_category_assignments").delete().eq("article_id", row.id), "Reset guide category");
  await required(await supabase.from("article_category_assignments").insert({ article_id: row.id, category_id: await categoryId("stocking-compatibility") }), "Attach guide category");
  const related = await careGuideIds(["betta-splendens", "guppy"]);
  await required(await supabase.from("article_related_care_guides").delete().eq("article_id", row.id), "Reset guide relationships");
  await required(await supabase.from("article_related_care_guides").insert(related.map((care_guide_id, display_order) => ({ article_id: row.id, care_guide_id, display_order, relationship_label: "Compared species care guide" }))), "Attach guide relationships");
  const persisted = { title: expandedGuide.title, slug: row.slug, summary: expandedGuide.summary, seoTitle: expandedGuide.seoTitle, metaDescription: expandedGuide.metaDescription, sections: expandedGuide.sections.map(([blockType, content]) => ({ blockType, content })) };
  const hash = createHash("sha256").update(JSON.stringify(persisted)).digest("hex");
  await required(await supabase.from("programmatic_guide_metadata").update({ current_content_hash: hash, manual_edits_detected: true, regeneration_status: "current", requires_regeneration: false, regeneration_reason: null }).eq("article_id", row.id), "Record editorial guide revision");
  await required(await supabase.from("articles").update({ title: expandedGuide.title, summary: expandedGuide.summary, seo_title: expandedGuide.seoTitle, meta_description: expandedGuide.metaDescription, status: "published", published_at: new Date().toISOString() }).eq("id", row.id).select("id").single(), "Republish expanded guide");
  console.log(`REPUBLISHED ${row.slug}: ${count} words, ${expandedGuide.sections.length} sections, ${ids.length} sources`);
}
async function main() {
  const inventory = [...articles.map((article) => ({ slug: article.slug, words: wordCount(article.sections), sections: article.sections.length })), { slug: "betta-splendens-vs-guppy", words: wordCount(expandedGuide.sections), sections: expandedGuide.sections.length }];
  console.log(JSON.stringify({ apply, inventory }, null, 2));
  if (!apply) {
    console.log("Dry run only. Pass --apply to publish using truthful current timestamps.");
    return;
  }
  await expandGuide();
  for (const article of articles) await publishArticle(article);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
