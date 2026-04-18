# Cross-country name authority report

Generated: 2026-04-18T19:03:05.962Z

## Summary

- Name rows: **2373**
- Plants (processed): **946**
- Plants with ≥3 distinct countries (union names + plant regions): **157**
- Name hubs where the same `normalized` slug maps to **>1** species: **161**
- Orphan name rows (plant_id missing from processed plants): **66**
- Country-level vs global dominant mismatches (rows): **0**

## Canonical scientific_name consistency

- Each name row carries a single primary `plant_id`; that id is present in `data/processed/plants.json` with one `scientific_name` per id (merge pipeline invariant).

## Top 50 plants by country coverage

| Rank | plant_id | countries | scientific_name |
| ---: | --- | ---: | --- |
| 1 | `matricaria_chamomilla` | 25 | Matricaria chamomilla L. |
| 2 | `urtica_dioica` | 18 | Urtica dioica L. |
| 3 | `thymus_vulgaris` | 15 | Thymus vulgaris L. |
| 4 | `mentha_spicata` | 14 | Mentha spicata L. |
| 5 | `ocimum_basilicum` | 14 | Ocimum basilicum L. |
| 6 | `plantago_major` | 14 | Plantago major L. |
| 7 | `valeriana_officinalis` | 14 | Valeriana officinalis L. |
| 8 | `asclepias_curassavica` | 13 | Asclepias curassavica L. |
| 9 | `melissa_officinalis` | 13 | Melissa officinalis L. |
| 10 | `mentha_x` | 13 | Mentha x piperita |
| 11 | `ruta_graveolens` | 13 | Ruta graveolens L. |
| 12 | `sambucus_nigra` | 13 | Sambucus nigra L. |
| 13 | `taraxacum_officinale` | 13 | Taraxacum officinale F.H.Wigg. |
| 14 | `equisetum_arvense` | 12 | Equisetum arvense L. |
| 15 | `salvia_rosmarinus` | 12 | Salvia rosmarinus L. |
| 16 | `bixa_orellana` | 11 | Bixa orellana L. |
| 17 | `curatella_americana` | 11 | Curatella americana |
| 18 | `psidium_guajava` | 11 | Psidium guajava L. |
| 19 | `salvia_officinalis` | 11 | Salvia officinalis L. |
| 20 | `artemisia_absinthium` | 10 | Artemisia absinthium L. |
| 21 | `bidens_pilosa` | 10 | Bidens pilosa L. |
| 22 | `chaptalia_nutans` | 10 | Chaptalia nutans |
| 23 | `hypericum_perforatum` | 10 | Hypericum perforatum L. |
| 24 | `cymbopogon_citratus` | 9 | Cymbopogon citratus (DC.) Stapf |
| 25 | `mentha_piperita` | 9 | Mentha piperita |
| 26 | `xanthosoma_violaceum` | 9 | Xanthosoma violaceum |
| 27 | `achillea_millefolium` | 8 | Achillea millefolium L. |
| 28 | `alibertia_edulis` | 8 | Alibertia edulis |
| 29 | `aloe_vera` | 8 | Aloe vera (L.) Burm. f. |
| 30 | `arnica_montana` | 8 | Arnica montana L. |
| 31 | `bursera_simaruba` | 8 | Bursera simaruba |
| 32 | `byrsonima_crassifolia` | 8 | Byrsonima crassifolia (L.) Kunth |
| 33 | `erythrina_berteroana` | 8 | Erythrina berteroana |
| 34 | `foeniculum_vulgare` | 8 | Foeniculum vulgare Mill. |
| 35 | `lavandula_angustifolia` | 8 | Lavandula angustifolia Mill. |
| 36 | `matricaria_recutita` | 8 | Matricaria recutita L. |
| 37 | `momordica_charantia` | 8 | Momordica charantia L. |
| 38 | `petiveria_alliacea` | 8 | Petiveria alliacea L. |
| 39 | `peumus_boldus` | 8 | Peumus boldus Molina |
| 40 | `aloysia_citrodora` | 7 | Aloysia citrodora Palau |
| 41 | `anacardium_occidentale` | 7 | Anacardium occidentale |
| 42 | `baccharis_trinervis` | 7 | Baccharis trinervis |
| 43 | `calendula_officinalis` | 7 | Calendula officinalis L. |
| 44 | `carica_papaya` | 7 | Carica papaya L. |
| 45 | `cassia_grandis` | 7 | Cassia grandis |
| 46 | `juniperus_communis` | 7 | Juniperus communis L. |
| 47 | `justicia_pectoralis` | 7 | Justicia pectoralis |
| 48 | `plantago_lanceolata` | 7 | Plantago lanceolata |
| 49 | `vernonanthura_patens` | 7 | Vernonanthura patens |
| 50 | `bromelia_pinguin` | 6 | Bromelia pinguin |

## Top mismatches between global dominant vs regional dominant

For each plant with ≥3 countries, the **global** dominant label is the hub with the widest geographic footprint (`country_usage` or legacy `countries`; then shorter name). The **regional** dominant for ISO `C` is the row among those listing `C` with highest score: `+2` if `C` is present, `+ 0.3 × hub width`, `- 0.01 × label.length`; ties → shorter `name`, then `normalized`.

### Plants with the most mismatching countries

| plant_id | mismatching countries |
| --- | ---: |
| _(none)_ | 0 |

### Sample rows (first 40)

_No mismatches: for every country on multi-country plants, the regional dominant label matches the global dominant._


## Same common-name hub → different species (conflicts)

These hubs intentionally keep multiple rows (disambiguation in UI). Listed for QA.

| normalized | example label | #species | scientific_names |
| --- | --- | ---: | --- |
| `salvia` | Salvia | 6 | Buddleia americana; Callicarpa acuminata; Lippia alba (Mill.) N.E. Br. ex Britton & P. Wilson; Pluchea carolinensis; Salvia leucantha Cav.; Salvia officinalis L. |
| `arnica` | arnica | 5 | arnica_chamissonis; arnica_cordifolia; Arnica montana L.; Chaptalia nutans; Tithonia diversifolia (Hemsl.) A. Gray |
| `insulina` | Insulina | 5 | Costus igneus; Costus pictus; Justicia secunda; Justicia spicigera; Piper auritum Kunth |
| `oregano` | Orégano | 5 | Lippia alba (Mill.) N.E. Br. ex Britton & P. Wilson; Lippia graveolens; Lippia micromera; Origanum vulgare subsp. hirtum; Plectranthus amboinicus (Lour.) Spreng. |
| `santa_maria` | Santa María | 5 | Baccharis trinervis; Lippia alba (Mill.) N.E. Br. ex Britton & P. Wilson; Piper auritum Kunth; Pluchea odorata (L.) Cass.; Vernonanthura patens |
| `amargon` | Amargón | 4 | Calea urticifolia; Chaptalia nutans; Sonchus oleraceus; Taraxacum officinale F.H.Wigg. |
| `cadillo` | Cadillo | 4 | Acaena magellanica; Bidens pilosa L.; Commelina erecta; Xanthium cavanillesii |
| `lengua_de_vaca` | Lengua de vaca | 4 | Baccharis trinervis; Chaptalia nutans; Curatella americana; Rumex conglomeratus |
| `malva` | malva | 4 | Althaea officinalis; Malva parviflora; Malva sylvestris L.; Malvaviscus arboreus |
| `molle` | Molle | 4 | Lithraea molleoides; Schinus areira; Schinus molle L.; Schinus terebinthifolius |
| `quina` | Quina | 4 | Cinchona officinalis; Cinchona pubescens; Coutarea hexandra; Quassia amara |
| `suelda_con_suelda` | Suelda con suelda | 4 | Anredera vesicaria; Commelina erecta; Psittacanthus calyculatus; Symphytum officinale |
| `una_de_gato` | Uña de gato | 4 | Celtis iguanaea; Martynia annua; Mulinum spinosum; Uncaria tomentosa |
| `valeriana` | Valeriana | 4 | Chaptalia nutans; Chrysopogon zizanioides; Momordica charantia L.; Valeriana officinalis L. |
| `verbena` | Verbena | 4 | Scoparia dulcis; Verbena litoralis; Verbena littoralis; Verbena officinalis |
| `altamiz` | Altamiz | 3 | Ambrosia cumanensis; Ambrosia peruviana; Parthenium hysterophorus L. |
| `amapola` | Amapola | 3 | Hibiscus rosa-sinensis L.; Malvaviscus arboreus; Papaver rhoeas |
| `aromo` | Aromo | 3 | Acacia aroma; Acacia caven; Acacia farnesiana (L.) Willd. |
| `artemisa` | Artemisa | 3 | Ambrosia cumanensis; Chrysanthemum parthenium (L.) Bernh.; Tanacetum parthenium (L.) Sch. Bip. |
| `bailahuen` | Bailahuén | 3 | Haplopappus bailahuen; Haplopappus rigidus; Haplopappus spp. |
| `bee_balm` | bee balm | 3 | monarda_didyma; monarda_fistulosa; monarda_punctata |
| `cabello_de_angel` | Cabello de ángel | 3 | Cuscuta americana L.; Cuscuta chilensis; Tillandsia usneoides |
| `cactus` | cactus | 3 | cylindropuntia_spp; echinocereus_spp; opuntia_spp |
| `cedron` | Cedrón | 3 | Aloysia citriodora; Aloysia citrodora Palau; Aloysia triphylla (L'Hér.) Britton |
| `cola_de_caballo` | Cola de Caballo | 3 | Equisetum arvense L.; Equisetum bogotense; Equisetum giganteum |
| `contrayerba` | Contrayerba | 3 | Dorstenia brasiliensis; Dorstenia contrajerva; Flaveria bidentis |
| `dogwood` | dogwood | 3 | cornus_florida; Cornus sericea; cornus_spp |
| `echinacea` | Echinacea | 3 | Echinacea angustifolia; Echinacea pallida; Echinacea purpurea |
| `evening_primrose` | evening primrose | 3 | oenothera_biennis; oenothera_caespitosa; oenothera_speciosa |
| `ginseng` | ginseng | 3 | eleutherococcus_senticosus; panax_ginseng; Panax quinquefolius |
| `goldenrod` | Goldenrod | 3 | Solidago canadensis; Solidago odora; solidago_speciosa |
| `guaco` | Guaco | 3 | Aristolochia maxima; Cissampelos pareira L.; Mikania periplocifolia |
| `hierba_del_cancer` | Hierba del cáncer | 3 | Acalypha arvensis; Cuphea aequipetala Cav.; Hamelia patens Jacq. |
| `hierba_dulce` | Hierba dulce | 3 | Calceolaria thyrsiflora; Phyla dulcis; Stevia rebaudiana Bertoni |
| `hierba_luisa` | Hierba luisa | 3 | Aloysia citriodora; Aloysia citrodora Palau; Aloysia triphylla (L'Hér.) Britton |
| `hoja_blanca` | Hoja Blanca | 3 | Buddleia americana; Buddleja americana; Calathea lutea |
| `juniper` | juniper | 3 | Juniperus communis L.; juniperus_monosperma; juniperus_virginiana |
| `matricaria` | Matricaria | 3 | Matricaria chamomilla L.; Matricaria recutita L.; Tanacetum parthenium (L.) Sch. Bip. |
| `menta` | Menta | 3 | Mentha piperita; Mentha spicata L.; Mentha x piperita |
| `milkweed` | milkweed | 3 | asclepias_incarnata; asclepias_syriaca; asclepias_tuberosa |
| `mint` | mint | 3 | Mentha arvensis; Mentha spicata L.; Mentha x piperita |
| `mountain_mint` | mountain mint | 3 | pycnanthemum_muticum; pycnanthemum_tenuifolium; pycnanthemum_virginianum |
| `oak` | oak | 3 | quercus_alba; quercus_rubra; quercus_spp |
| `ortiga` | Ortiga | 3 | Urera baccifera (L.) Gaudich. ex Wedd.; Urtica dioica L.; Urtica urens |
| `paico` | Paico | 3 | Chenopodium ambrosioides; Chenopodium chilense; Dysphania ambrosioides (L.) Mosyakin & Clemants |
| `palo_santo` | Palo santo | 3 | Bulnesia sarmientoi; Bursera graveolens; Erythrina fusca |
| `pasiflora` | Pasiflora | 3 | Passiflora caerulea; Passiflora edulis; Passiflora quadrangularis |
| `peppermint` | Peppermint | 3 | Mentha × piperita; Mentha piperita; Mentha x piperita |
| `pine` | pine | 3 | pinus_resinosa; pinus_spp; pinus_strobus |
| `pingo_pingo` | Pingo pingo | 3 | Ephedra americana; Ephedra chilensis; Ephedra triandra |
| `poleo` | Poleo | 3 | Lippia turbinata; Mentha pulegium L.; Mentha viridis L. |
| `sage` | sage | 3 | salvia_apiana; salvia_columbariae; Salvia officinalis L. |
| `sauco` | Sauco | 3 | Sambucus canadensis; Sambucus mexicana C. Presl ex DC.; Sambucus nigra L. |
| `skullcap` | skullcap | 3 | scutellaria_baicalensis; scutellaria_incana; scutellaria_lateriflora |
| `sumac` | sumac | 3 | rhus_glabra; rhus_trilobata; rhus_typhina |
| `tepozan` | Tepozán | 3 | Buddleia americana; Buddleia cordata H.B.K.; Buddleja americana |
| `tilo` | Tilo | 3 | Justicia pectoralis; Tilia cordata Mill.; Tilia sp. |
| `willow` | willow | 3 | salix_alba; salix_nigra; Salix spp. |
| `yucca` | yucca | 3 | yucca_baccata; yucca_elata; yucca_glauca |
| `zarzaparrilla` | Zarzaparrilla | 3 | Ribes cucullatum; Smilax sp.; Smilax spinosa |
| `abrojo` | Abrojo | 2 | Xanthium cavanillesii; Xanthium spinosum |
| `aceituno` | Aceituno | 2 | Simarouba amara; Simarouba glauca |
| `achicoria_amarga` | Achicoria amarga | 2 | Cichorium intybus L.; Taraxacum officinale F.H.Wigg. |
| `albahaca` | Albahaca | 2 | Ocimum basilicum L.; Ocimum campechianum |
| `altamisa` | Altamisa | 2 | Ambrosia cumanensis; Parthenium hysterophorus L. |
| `altamiza` | Altamiza | 2 | Artemisia sp.; Chrysanthemum parthenium (L.) Bernh. |
| `ambaibo` | Ambaibo | 2 | Cecropia concolor; Cecropia pachystachya |
| `amor_seco` | Amor seco | 2 | Bidens pilosa L.; Desmodium uncinatum |
| `anisillo` | Anisillo | 2 | Piper auritum Kunth; Tagetes lucida Cav. |
| `arandano` | Arándano | 2 | Vaccinium macrocarpon Aiton.; Vaccinium myrtillus |
| `arnica_del_pais` | Arnica del país | 2 | Chaptalia nutans; Heterotheca inuloides Cass. |
| `artemisia` | Artemisia | 2 | Ambrosia cumanensis; Artemisia vulgaris |
| `bearberry` | bearberry | 2 | arctostaphylos_uva_ursi; Arctostaphylos uva-ursi |
| `boldo` | Boldo | 2 | Peumus boldus Molina; Plectranthus barbatus |
| `borsmenta` | borsmenta | 2 | Mentha piperita; Mentha x piperita |
| `bretonica` | Bretónica | 2 | Chaptalia nutans; Lepechinia caulescens (Ort.) Epling |
| `brusca` | Brusca | 2 | Cassia occidentalis L.; Senna occidentalis (L.) Link |
| `calabaza` | Calabaza | 2 | Crescentia cujete; Cucurbita pepo |
| `calaguala` | Calaguala | 2 | Phlebodium pseudoaureum (Cav.)
   Lellinger; Polypodium feuillei |
| `cana_agria` | Caña agria | 2 | Costus pictus; Costus spicatus |
| … | (81 more) | | |

## Row fields (processed + bundled names)

**Plant-level** (when `plant_country_span` ≥ 3):

- `plant_country_span`: distinct ISO codes for the plant (names ∪ `plants.json` regions).
- `plant_authority_tier`: `cross_regional` if span ≥ 3; `cosmopolitan` if span ≥ 15.
- `plant_name_variants`: other indexed labels for the same plant.

**Name-level** (all rows):

- `name_country_count`: number of distinct ISO codes on this hub row (`country_usage` or `countries`).
- `is_global_dominant_name`: true on one row per multi-country plant (widest hub coverage).
- `dominant_in_countries`: ISO list where this row wins the per-country competition for that plant.
