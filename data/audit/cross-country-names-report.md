# Cross-country name authority report

Generated: 2026-04-18T02:52:11.971Z

## Summary

- Name rows: **2081**
- Plants (processed): **831**
- Plants with ≥3 distinct countries (union names + plant regions): **150**
- Name hubs where the same `normalized` slug maps to **>1** species: **135**
- Orphan name rows (plant_id missing from processed plants): **0**
- Country-level vs global dominant mismatches (rows): **18**

## Canonical scientific_name consistency

- Each name row carries a single primary `plant_id`; that id is present in `data/processed/plants.json` with one `scientific_name` per id (merge pipeline invariant).

## Top 50 plants by country coverage

| Rank | plant_id | countries | scientific_name |
| ---: | --- | ---: | --- |
| 1 | `matricaria_chamomilla` | 24 | Matricaria chamomilla L. |
| 2 | `urtica_dioica` | 16 | Urtica dioica L. |
| 3 | `asclepias_curassavica` | 13 | Asclepias curassavica L. |
| 4 | `mentha_spicata` | 13 | Mentha spicata L. |
| 5 | `ocimum_basilicum` | 13 | Ocimum basilicum L. |
| 6 | `plantago_major` | 13 | Plantago major L. |
| 7 | `ruta_graveolens` | 13 | Ruta graveolens L. |
| 8 | `thymus_vulgaris` | 13 | Thymus vulgaris L. |
| 9 | `melissa_officinalis` | 12 | Melissa officinalis L. |
| 10 | `valeriana_officinalis` | 12 | Valeriana officinalis L. |
| 11 | `bixa_orellana` | 11 | Bixa orellana L. |
| 12 | `curatella_americana` | 11 | Curatella americana |
| 13 | `mentha_x` | 11 | Mentha x piperita |
| 14 | `psidium_guajava` | 11 | Psidium guajava L. |
| 15 | `salvia_rosmarinus` | 11 | Salvia rosmarinus L. |
| 16 | `sambucus_nigra` | 11 | Sambucus nigra L. |
| 17 | `taraxacum_officinale` | 11 | Taraxacum officinale F.H.Wigg. |
| 18 | `bidens_pilosa` | 10 | Bidens pilosa L. |
| 19 | `chaptalia_nutans` | 10 | Chaptalia nutans |
| 20 | `cymbopogon_citratus` | 9 | Cymbopogon citratus (DC.) Stapf |
| 21 | `equisetum_arvense` | 9 | Equisetum arvense L. |
| 22 | `xanthosoma_violaceum` | 9 | Xanthosoma violaceum |
| 23 | `alibertia_edulis` | 8 | Alibertia edulis |
| 24 | `aloe_vera` | 8 | Aloe vera (L.) Burm. f. |
| 25 | `artemisia_absinthium` | 8 | Artemisia absinthium L. |
| 26 | `bursera_simaruba` | 8 | Bursera simaruba |
| 27 | `byrsonima_crassifolia` | 8 | Byrsonima crassifolia (L.) Kunth |
| 28 | `erythrina_berteroana` | 8 | Erythrina berteroana |
| 29 | `hypericum_perforatum` | 8 | Hypericum perforatum L. |
| 30 | `mentha_piperita` | 8 | Mentha piperita |
| 31 | `momordica_charantia` | 8 | Momordica charantia L. |
| 32 | `petiveria_alliacea` | 8 | Petiveria alliacea L. |
| 33 | `peumus_boldus` | 8 | Peumus boldus Molina |
| 34 | `salvia_officinalis` | 8 | Salvia officinalis L. |
| 35 | `aloysia_citrodora` | 7 | Aloysia citrodora Palau |
| 36 | `anacardium_occidentale` | 7 | Anacardium occidentale |
| 37 | `arnica_montana` | 7 | Arnica montana L. |
| 38 | `baccharis_trinervis` | 7 | Baccharis trinervis |
| 39 | `carica_papaya` | 7 | Carica papaya L. |
| 40 | `cassia_grandis` | 7 | Cassia grandis |
| 41 | `foeniculum_vulgare` | 7 | Foeniculum vulgare Mill. |
| 42 | `justicia_pectoralis` | 7 | Justicia pectoralis |
| 43 | `matricaria_recutita` | 7 | Matricaria recutita L. |
| 44 | `plantago_lanceolata` | 7 | Plantago lanceolata |
| 45 | `vernonanthura_patens` | 7 | Vernonanthura patens |
| 46 | `achillea_millefolium` | 6 | Achillea millefolium L. |
| 47 | `bromelia_pinguin` | 6 | Bromelia pinguin |
| 48 | `calea_urticifolia` | 6 | Calea urticifolia |
| 49 | `calendula_officinalis` | 6 | Calendula officinalis L. |
| 50 | `cecropia_peltata` | 6 | Cecropia peltata |

## Top mismatches between global dominant vs regional dominant

For each plant with ≥3 countries, the **global** dominant label is the hub with the widest `countries` array (then shorter name). The **regional** dominant for ISO `C` is the row among those listing `C` with highest score: `+2` if `C` ∈ `countries`, `+ 0.3 × countries.length`, `- 0.01 × label.length`; ties → shorter `name`, then `normalized`.

### Plants with the most mismatching countries

| plant_id | mismatching countries |
| --- | ---: |
| `achillea_millefolium` | 2 |
| `juniperus_communis` | 2 |
| `urtica_dioica` | 2 |
| `althaea_officinalis` | 1 |
| `arctium_lappa` | 1 |
| `betula_pendula` | 1 |
| `borago_officinalis` | 1 |
| `cichorium_intybus` | 1 |
| `datura_stramonium` | 1 |
| `mentha_x` | 1 |
| `plantago_major` | 1 |
| `portulaca_oleracea` | 1 |
| `rosa_canina` | 1 |
| `sambucus_nigra` | 1 |
| `vaccinium_myrtillus` | 1 |

### Sample rows (first 40)

| plant_id | country | global label | regional label |
| --- | --- | --- | --- |
| `achillea_millefolium` | BG | Yarrow | Common yarrow |
| `achillea_millefolium` | RO | Yarrow | Duodela |
| `althaea_officinalis` | RO | Altea | malva |
| `arctium_lappa` | RO | Čičak | Riborasta |
| `betula_pendula` | CZ | Berk | bříza bělokorá |
| `borago_officinalis` | RO | Borage | borange |
| `cichorium_intybus` | CZ | Chicory | cikorie |
| `datura_stramonium` | RO | Kieri | Salia |
| `juniperus_communis` | BG | Enebro | Common juniper |
| `juniperus_communis` | CZ | Enebro | břín |
| `mentha_x` | RO | Нане | Tendila |
| `plantago_major` | BG | Lantén | Broadleaf plantain |
| `portulaca_oleracea` | RO | Verdolaga | Iaca |
| `rosa_canina` | CZ | Dog rose | merhelec |
| `sambucus_nigra` | CZ | Hyld | bezinky |
| `urtica_dioica` | CZ | Nettle | žihavka |
| `urtica_dioica` | RO | Nettle | Dyn |
| `vaccinium_myrtillus` | CZ | Arándano | černá jahoda |

## Same common-name hub → different species (conflicts)

These hubs intentionally keep multiple rows (disambiguation in UI). Listed for QA.

| normalized | example label | #species | scientific_names |
| --- | --- | ---: | --- |
| `salvia` | Salvia | 6 | Buddleia americana; Callicarpa acuminata; Lippia alba (Mill.) N.E. Br. ex Britton & P. Wilson; Pluchea carolinensis; Salvia leucantha Cav.; Salvia officinalis L. |
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
| `arnica` | Árnica | 3 | Arnica montana L.; Chaptalia nutans; Tithonia diversifolia (Hemsl.) A. Gray |
| `aromo` | Aromo | 3 | Acacia aroma; Acacia caven; Acacia farnesiana (L.) Willd. |
| `artemisa` | Artemisa | 3 | Ambrosia cumanensis; Chrysanthemum parthenium (L.) Bernh.; Tanacetum parthenium (L.) Sch. Bip. |
| `bailahuen` | Bailahuén | 3 | Haplopappus bailahuen; Haplopappus rigidus; Haplopappus spp. |
| `cabello_de_angel` | Cabello de ángel | 3 | Cuscuta americana L.; Cuscuta chilensis; Tillandsia usneoides |
| `cedron` | Cedrón | 3 | Aloysia citriodora; Aloysia citrodora Palau; Aloysia triphylla (L'Hér.) Britton |
| `cola_de_caballo` | Cola de Caballo | 3 | Equisetum arvense L.; Equisetum bogotense; Equisetum giganteum |
| `contrayerba` | Contrayerba | 3 | Dorstenia brasiliensis; Dorstenia contrajerva; Flaveria bidentis |
| `guaco` | Guaco | 3 | Aristolochia maxima; Cissampelos pareira L.; Mikania periplocifolia |
| `hierba_del_cancer` | Hierba del cáncer | 3 | Acalypha arvensis; Cuphea aequipetala Cav.; Hamelia patens Jacq. |
| `hierba_dulce` | Hierba dulce | 3 | Calceolaria thyrsiflora; Phyla dulcis; Stevia rebaudiana Bertoni |
| `hierba_luisa` | Hierba luisa | 3 | Aloysia citriodora; Aloysia citrodora Palau; Aloysia triphylla (L'Hér.) Britton |
| `hoja_blanca` | Hoja Blanca | 3 | Buddleia americana; Buddleja americana; Calathea lutea |
| `matricaria` | Matricaria | 3 | Matricaria chamomilla L.; Matricaria recutita L.; Tanacetum parthenium (L.) Sch. Bip. |
| `menta` | Menta | 3 | Mentha piperita; Mentha spicata L.; Mentha x piperita |
| `ortiga` | Ortiga | 3 | Urera baccifera (L.) Gaudich. ex Wedd.; Urtica dioica L.; Urtica urens |
| `paico` | Paico | 3 | Chenopodium ambrosioides; Chenopodium chilense; Dysphania ambrosioides (L.) Mosyakin & Clemants |
| `palo_santo` | Palo santo | 3 | Bulnesia sarmientoi; Bursera graveolens; Erythrina fusca |
| `pasiflora` | Pasiflora | 3 | Passiflora caerulea; Passiflora edulis; Passiflora quadrangularis |
| `pingo_pingo` | Pingo pingo | 3 | Ephedra americana; Ephedra chilensis; Ephedra triandra |
| `poleo` | Poleo | 3 | Lippia turbinata; Mentha pulegium L.; Mentha viridis L. |
| `sauco` | Sauco | 3 | Sambucus canadensis; Sambucus mexicana C. Presl ex DC.; Sambucus nigra L. |
| `tepozan` | Tepozán | 3 | Buddleia americana; Buddleia cordata H.B.K.; Buddleja americana |
| `tilo` | Tilo | 3 | Justicia pectoralis; Tilia cordata Mill.; Tilia sp. |
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
| `boldo` | Boldo | 2 | Peumus boldus Molina; Plectranthus barbatus |
| `bretonica` | Bretónica | 2 | Chaptalia nutans; Lepechinia caulescens (Ort.) Epling |
| `brusca` | Brusca | 2 | Cassia occidentalis L.; Senna occidentalis (L.) Link |
| `calabaza` | Calabaza | 2 | Crescentia cujete; Cucurbita pepo |
| `calaguala` | Calaguala | 2 | Phlebodium pseudoaureum (Cav.)
   Lellinger; Polypodium feuillei |
| `cana_agria` | Caña agria | 2 | Costus pictus; Costus spicatus |
| `caulote` | Caulote | 2 | Brugmansia sanguinea; Guazuma ulmifolia Lam. |
| `cepa_caballo` | Cepa caballo | 2 | Acaena splendens; Xanthium spinosum |
| `chamomile` | Chamomile | 2 | Chamomilla recutita; Matricaria chamomilla L. |
| `chaparro` | Chaparro | 2 | Byrsonima crassifolia (L.) Kunth; Curatella americana |
| `chaya` | Chaya | 2 | Cnidoscolus aconitifolius (Mill.) I.M. Johnst.; Cnidoscolus chayamansa McVaugh |
| `chilca` | Chilca | 2 | Baccharis trinervis; Eupatorium buniifolium |
| `contrahierba` | Contrahierba | 2 | Dorstenia contrajerba L.; Dorstenia contrajerva |
| `coralillo` | Coralillo | 2 | Erythrina berteroana; Hamelia patens Jacq. |
| `cresta_de_gallo` | Cresta de gallo | 2 | Erythrina berteroana; Senna occidentalis (L.) Link |
| `cuajatinta` | Cuajatinta | 2 | Cordia bullata var. globosa; Cordia inermis |
| `cuasia` | Cuasia | 2 | Picrasma crenata; Quassia amara |
| `culantrillo` | Culantrillo | 2 | Adiantum capillus-veneris; Scoparia dulcis |
| `diente_de_leon` | diente de león | 2 | Sonchus oleraceus; Taraxacum officinale F.H.Wigg. |
| `doradilla` | Doradilla | 2 | Selaginella convoluta (Arn.) Spring; Selaginella lepidophylla (Hook. & Grev.) Spring |
| `epazote` | Epazote | 2 | Chenopodium ambrosioides; Dysphania ambrosioides (L.) Mosyakin & Clemants |
| `eucalipto` | Eucalipto | 2 | Eucalyptus camaldulensis; Eucalyptus globulus |
| `guacimo` | guácimo | 2 | Brugmansia sanguinea; Guazuma ulmifolia Lam. |
| `guarumbo` | Guarumbo | 2 | Cecropia obtusifolia; Cecropia peltata |
| `guarumo` | Guarumo | 2 | Cecropia obtusifolia; Cecropia peltata |
| `hierba_de_erisipela` | Hierba de erisipela | 2 | Buddleja americana; Hamelia patens Jacq. |
| `hierba_de_plata` | Hierba de Plata | 2 | Equisetum bogotense; Equisetum giganteum |
| … | (55 more) | | |

## Row fields (processed + bundled names)

**Plant-level** (when `plant_country_span` ≥ 3):

- `plant_country_span`: distinct ISO codes for the plant (names ∪ `plants.json` regions).
- `plant_authority_tier`: `cross_regional` if span ≥ 3; `cosmopolitan` if span ≥ 15.
- `plant_name_variants`: other indexed labels for the same plant.

**Name-level** (all rows):

- `name_country_count`: `countries.length` for this hub row.
- `is_global_dominant_name`: true on one row per multi-country plant (widest hub coverage).
- `dominant_in_countries`: ISO list where this row wins the per-country competition for that plant.
