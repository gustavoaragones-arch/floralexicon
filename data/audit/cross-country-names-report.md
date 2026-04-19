# Cross-country name authority report

Generated: 2026-04-19T03:08:59.349Z

## Summary

- Name rows: **2889**
- Plants (processed): **1324**
- Plants with ≥3 distinct countries (union names + plant regions): **218**
- Name hubs where the same `normalized` slug maps to **>1** species: **234**
- Orphan name rows (plant_id missing from processed plants): **65**
- Country-level vs global dominant mismatches (rows): **0**

## Canonical scientific_name consistency

- Each name row carries a single primary `plant_id`; that id is present in `data/processed/plants.json` with one `scientific_name` per id (merge pipeline invariant).

## Top 50 plants by country coverage

| Rank | plant_id | countries | scientific_name |
| ---: | --- | ---: | --- |
| 1 | `matricaria_chamomilla` | 25 | Matricaria chamomilla L. |
| 2 | `urtica_dioica` | 21 | Urtica dioica L. |
| 3 | `plantago_major` | 16 | Plantago major L. |
| 4 | `mentha_spicata` | 15 | Mentha spicata L. |
| 5 | `sambucus_nigra` | 15 | Sambucus nigra L. |
| 6 | `taraxacum_officinale` | 15 | Taraxacum officinale F.H.Wigg. |
| 7 | `thymus_vulgaris` | 15 | Thymus vulgaris L. |
| 8 | `valeriana_officinalis` | 15 | Valeriana officinalis L. |
| 9 | `mentha_x` | 14 | Mentha x piperita |
| 10 | `ocimum_basilicum` | 14 | Ocimum basilicum L. |
| 11 | `asclepias_curassavica` | 13 | Asclepias curassavica L. |
| 12 | `equisetum_arvense` | 13 | Equisetum arvense L. |
| 13 | `melissa_officinalis` | 13 | Melissa officinalis L. |
| 14 | `ruta_graveolens` | 13 | Ruta graveolens L. |
| 15 | `salvia_officinalis` | 13 | Salvia officinalis L. |
| 16 | `psidium_guajava` | 12 | Psidium guajava L. |
| 17 | `salvia_rosmarinus` | 12 | Salvia rosmarinus L. |
| 18 | `artemisia_absinthium` | 11 | Artemisia absinthium L. |
| 19 | `bidens_pilosa` | 11 | Bidens pilosa L. |
| 20 | `bixa_orellana` | 11 | Bixa orellana L. |
| 21 | `curatella_americana` | 11 | Curatella americana |
| 22 | `mentha_piperita` | 11 | Mentha piperita |
| 23 | `rosmarinus_officinalis` | 11 | Rosmarinus officinalis L. |
| 24 | `chaptalia_nutans` | 10 | Chaptalia nutans |
| 25 | `foeniculum_vulgare` | 10 | Foeniculum vulgare Mill. |
| 26 | `hypericum_perforatum` | 10 | Hypericum perforatum L. |
| 27 | `achillea_millefolium` | 9 | Achillea millefolium L. |
| 28 | `aloe_vera` | 9 | Aloe vera (L.) Burm. f. |
| 29 | `byrsonima_crassifolia` | 9 | Byrsonima crassifolia (L.) Kunth |
| 30 | `cymbopogon_citratus` | 9 | Cymbopogon citratus (DC.) Stapf |
| 31 | `malva_sylvestris` | 9 | Malva sylvestris L. |
| 32 | `matricaria_recutita` | 9 | Matricaria recutita L. |
| 33 | `xanthosoma_violaceum` | 9 | Xanthosoma violaceum |
| 34 | `alibertia_edulis` | 8 | Alibertia edulis |
| 35 | `aloysia_citrodora` | 8 | Aloysia citrodora Palau |
| 36 | `arnica_montana` | 8 | Arnica montana L. |
| 37 | `bursera_simaruba` | 8 | Bursera simaruba |
| 38 | `calendula_officinalis` | 8 | Calendula officinalis L. |
| 39 | `carica_papaya` | 8 | Carica papaya L. |
| 40 | `costus_spicatus` | 8 | Costus spicatus |
| 41 | `erythrina_berteroana` | 8 | Erythrina berteroana |
| 42 | `hamelia_patens` | 8 | Hamelia patens Jacq. |
| 43 | `juniperus_communis` | 8 | Juniperus communis L. |
| 44 | `justicia_pectoralis` | 8 | Justicia pectoralis |
| 45 | `lavandula_angustifolia` | 8 | Lavandula angustifolia Mill. |
| 46 | `momordica_charantia` | 8 | Momordica charantia L. |
| 47 | `petiveria_alliacea` | 8 | Petiveria alliacea L. |
| 48 | `peumus_boldus` | 8 | Peumus boldus Molina |
| 49 | `plantago_lanceolata` | 8 | Plantago lanceolata |
| 50 | `senna_alata` | 8 | Senna alata (L.) Roxb. |

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
| `santa_maria` | Santa María | 8 | Baccharis trinervis; Calophyllum brasiliense; Lippia alba (Mill.) N.E. Br. ex Britton & P. Wilson; Piper auritum Kunth; Piper peltatum; Piper umbellatum; Pluchea odorata (L.) Cass.; Vernonanthura patens |
| `lengua_de_vaca` | Lengua de vaca | 6 | Baccharis trinervis; Chaptalia nutans; Curatella americana; Rumex conglomeratus; Rumex crispus; Rumex obtusifolius |
| `salvia` | Salvia | 6 | Buddleia americana; Callicarpa acuminata; Lippia alba (Mill.) N.E. Br. ex Britton & P. Wilson; Pluchea carolinensis; Salvia leucantha Cav.; Salvia officinalis L. |
| `arnica` | arnica | 5 | arnica_chamissonis; arnica_cordifolia; Arnica montana L.; Chaptalia nutans; Tithonia diversifolia (Hemsl.) A. Gray |
| `insulina` | Insulina | 5 | Costus igneus; Costus pictus; Justicia secunda; Justicia spicigera; Piper auritum Kunth |
| `oregano` | Orégano | 5 | Lippia alba (Mill.) N.E. Br. ex Britton & P. Wilson; Lippia graveolens; Lippia micromera; Origanum vulgare subsp. hirtum; Plectranthus amboinicus (Lour.) Spreng. |
| `una_de_gato` | Uña de gato | 5 | Celtis iguanaea; Martynia annua; Mulinum spinosum; Uncaria guianensis; Uncaria tomentosa |
| `amargon` | Amargón | 4 | Calea urticifolia; Chaptalia nutans; Sonchus oleraceus; Taraxacum officinale F.H.Wigg. |
| `amor_seco` | Amor seco | 4 | Bidens andicola; Bidens pilosa L.; Desmodium adscendens; Desmodium uncinatum |
| `cadillo` | Cadillo | 4 | Acaena magellanica; Bidens pilosa L.; Commelina erecta; Xanthium cavanillesii |
| `cedron` | Cedrón | 4 | Aloysia citriodora; Aloysia citrodora Palau; Aloysia triphylla (L'Hér.) Britton; Lippia citriodora |
| `contrayerba` | Contrayerba | 4 | Aristolochia didyma; Dorstenia brasiliensis; Dorstenia contrajerva; Flaveria bidentis |
| `guaco` | Guaco | 4 | Aristolochia maxima; Aristolochia odoratissima; Cissampelos pareira L.; Mikania periplocifolia |
| `malva` | malva | 4 | Althaea officinalis; Malva parviflora; Malva sylvestris L.; Malvaviscus arboreus |
| `menta` | Menta | 4 | Mentha × piperita; Mentha piperita; Mentha spicata L.; Mentha x piperita |
| `molle` | Molle | 4 | Lithraea molleoides; Schinus areira; Schinus molle L.; Schinus terebinthifolius |
| `pingo_pingo` | Pingo pingo | 4 | Ephedra americana; Ephedra chilensis; Ephedra ochreata; Ephedra triandra |
| `poleo` | Poleo | 4 | Lippia turbinata; Lippia turpina; Mentha pulegium L.; Mentha viridis L. |
| `quina` | Quina | 4 | Cinchona officinalis; Cinchona pubescens; Coutarea hexandra; Quassia amara |
| `sauco` | Saúco | 4 | Sambucus australis; Sambucus canadensis; Sambucus mexicana C. Presl ex DC.; Sambucus nigra L. |
| `siempre_viva` | Siempre viva | 4 | Bryophyllum pinnatum; Gomphrena globosa; Gomphrena perennis; Peperomia pellucida |
| `suelda_con_suelda` | Suelda con suelda | 4 | Anredera vesicaria; Commelina erecta; Psittacanthus calyculatus; Symphytum officinale |
| `valeriana` | Valeriana | 4 | Chaptalia nutans; Chrysopogon zizanioides; Momordica charantia L.; Valeriana officinalis L. |
| `verbena` | Verbena | 4 | Scoparia dulcis; Verbena litoralis; Verbena littoralis; Verbena officinalis |
| `zarzaparrilla` | Zarzaparrilla | 4 | Ribes cucullatum; Smilax campestris; Smilax sp.; Smilax spinosa |
| `aji` | Ají | 3 | Capsicum annuum; Capsicum baccatum; Capsicum pubescens |
| `algarrobo` | Algarrobo | 3 | Hymenaea courbaril L.; Prosopis juliflora; Prosopis pallida |
| `altamisa` | Altamisa | 3 | Ageratum conyzoides; Ambrosia cumanensis; Parthenium hysterophorus L. |
| `altamiz` | Altamiz | 3 | Ambrosia cumanensis; Ambrosia peruviana; Parthenium hysterophorus L. |
| `amapola` | Amapola | 3 | Hibiscus rosa-sinensis L.; Malvaviscus arboreus; Papaver rhoeas |
| `aromo` | Aromo | 3 | Acacia aroma; Acacia caven; Acacia farnesiana (L.) Willd. |
| `artemisa` | Artemisa | 3 | Ambrosia cumanensis; Chrysanthemum parthenium (L.) Bernh.; Tanacetum parthenium (L.) Sch. Bip. |
| `bailahuen` | Bailahuén | 3 | Haplopappus bailahuen; Haplopappus rigidus; Haplopappus spp. |
| `barbasco` | Barbasco | 3 | Byrsonima crassifolia (L.) Kunth; Dioscorea multiflora; Lonchocarpus utilis |
| `bee_balm` | bee balm | 3 | monarda_didyma; monarda_fistulosa; monarda_punctata |
| `cabello_de_angel` | Cabello de ángel | 3 | Cuscuta americana; Cuscuta chilensis; Tillandsia usneoides |
| `cactus` | cactus | 3 | cylindropuntia_spp; echinocereus_spp; opuntia_spp |
| `calaguala` | Calaguala | 3 | Phlebodium pseudoaureum; Polypodium aureum; Polypodium feuillei |
| `caraguata` | Caraguatá | 3 | Bromelia serra; Eryngium horridum; Eryngium paniculatum |
| `chilca` | Chilca | 3 | Baccharis latifolia; Baccharis trinervis; Eupatorium buniifolium |
| `cola_de_caballo` | Cola de Caballo | 3 | Equisetum arvense L.; Equisetum bogotense; Equisetum giganteum |
| `coralillo` | Coralillo | 3 | Erythrina berteroana; Hamelia patens Jacq.; Rivina humilis |
| `cuasia` | Cuasia | 3 | Picrasma crenata; Quassia amara; Quassia simaruba |
| `dogwood` | dogwood | 3 | cornus_florida; Cornus sericea; cornus_spp |
| `echinacea` | Echinacea | 3 | Echinacea angustifolia; Echinacea pallida; Echinacea purpurea |
| `escobilla` | Escobilla | 3 | Baccharis conferta Kunth; Hyptis suaveolens; Scoparia dulcis |
| `evening_primrose` | evening primrose | 3 | oenothera_biennis; oenothera_caespitosa; oenothera_speciosa |
| `ginseng` | ginseng | 3 | eleutherococcus_senticosus; Panax ginseng; Panax quinquefolius |
| `goldenrod` | Goldenrod | 3 | Solidago canadensis; Solidago odora; solidago_speciosa |
| `hierba_de_san_juan` | Hierba de San Juan | 3 | Hypericum laricifolium; Hypericum perforatum L.; Tagetes lucida Cav. |
| `hierba_del_cancer` | Hierba del cáncer | 3 | Acalypha arvensis; Cuphea aequipetala Cav.; Hamelia patens Jacq. |
| `hierba_dulce` | Hierba dulce | 3 | Calceolaria thyrsiflora; Phyla dulcis; Stevia rebaudiana Bertoni |
| `hierba_luisa` | Hierba luisa | 3 | Aloysia citriodora; Aloysia citrodora Palau; Aloysia triphylla (L'Hér.) Britton |
| `hoja_blanca` | Hoja Blanca | 3 | Buddleia americana; Buddleja americana; Calathea lutea |
| `juniper` | juniper | 3 | Juniperus communis L.; juniperus_monosperma; juniperus_virginiana |
| `mastuerzo` | Mastuerzo | 3 | Capsella bursa-pastoris; Coronopus didymus; Lepidium didymum |
| `matico` | Matico | 3 | Buddleja americana; Buddleja globosa; Piper aduncum |
| `matricaria` | Matricaria | 3 | Matricaria chamomilla L.; Matricaria recutita L.; Tanacetum parthenium (L.) Sch. Bip. |
| `milkweed` | milkweed | 3 | asclepias_incarnata; asclepias_syriaca; asclepias_tuberosa |
| `mint` | mint | 3 | Mentha arvensis; Mentha spicata L.; Mentha x piperita |
| `mountain_mint` | mountain mint | 3 | pycnanthemum_muticum; pycnanthemum_tenuifolium; pycnanthemum_virginianum |
| `oak` | oak | 3 | quercus_alba; quercus_rubra; quercus_spp |
| `ortiga` | Ortiga | 3 | Urera baccifera (L.) Gaudich. ex Wedd.; Urtica dioica L.; Urtica urens |
| `ortiga_brava` | Ortiga brava | 3 | Caiophora lateritia; Urera baccifera (L.) Gaudich. ex Wedd.; Urtica urens |
| `paico` | Paico | 3 | Chenopodium ambrosioides; Chenopodium chilense; Dysphania ambrosioides (L.) Mosyakin & Clemants |
| `palo_santo` | Palo santo | 3 | Bulnesia sarmientoi; Bursera graveolens; Erythrina fusca |
| `pasiflora` | Pasiflora | 3 | Passiflora caerulea; Passiflora edulis; Passiflora quadrangularis |
| `pasionaria` | Pasionaria | 3 | Passiflora caerulea; Passiflora edulis; Passiflora incarnata |
| `peppermint` | Peppermint | 3 | Mentha × piperita; Mentha piperita; Mentha x piperita |
| `pine` | pine | 3 | pinus_resinosa; pinus_spp; pinus_strobus |
| `sage` | sage | 3 | salvia_apiana; salvia_columbariae; Salvia officinalis L. |
| `skullcap` | skullcap | 3 | scutellaria_baicalensis; scutellaria_incana; scutellaria_lateriflora |
| `sumac` | sumac | 3 | rhus_glabra; rhus_trilobata; rhus_typhina |
| `tepozan` | Tepozán | 3 | Buddleia americana; Buddleia cordata H.B.K.; Buddleja americana |
| `tilo` | Tilo | 3 | Justicia pectoralis; Tilia cordata Mill.; Tilia sp. |
| `valeriana_andina` | Valeriana andina | 3 | Perezia coerulescens; Valeriana carnosa; Valeriana nivalis |
| `vira_vira` | Vira vira | 3 | Achyrocline satureioides; Gnaphalium spicatum; Pseudognaphalium viravira |
| `willow` | willow | 3 | salix_alba; salix_nigra; Salix spp. |
| `yucca` | yucca | 3 | yucca_baccata; yucca_elata; yucca_glauca |
| `abrojo` | Abrojo | 2 | Xanthium cavanillesii; Xanthium spinosum |
| … | (154 more) | | |

## Row fields (processed + bundled names)

**Plant-level** (when `plant_country_span` ≥ 3):

- `plant_country_span`: distinct ISO codes for the plant (names ∪ `plants.json` regions).
- `plant_authority_tier`: `cross_regional` if span ≥ 3; `cosmopolitan` if span ≥ 15.
- `plant_name_variants`: other indexed labels for the same plant.

**Name-level** (all rows):

- `name_country_count`: number of distinct ISO codes on this hub row (`country_usage` or `countries`).
- `is_global_dominant_name`: true on one row per multi-country plant (widest hub coverage).
- `dominant_in_countries`: ISO list where this row wins the per-country competition for that plant.
