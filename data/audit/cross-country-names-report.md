# Cross-country name authority report

Generated: 2026-04-20T20:02:19.991Z

## Summary

- Name rows: **3334**
- Plants (processed): **1472**
- Plants with ≥3 distinct countries (union names + plant regions): **301**
- Name hubs where the same `normalized` slug maps to **>1** species: **272**
- Orphan name rows (plant_id missing from processed plants): **65**
- Country-level vs global dominant mismatches (rows): **770**

## Canonical scientific_name consistency

- Each name row carries a single primary `plant_id`; that id is present in `data/processed/plants.json` with one `scientific_name` per id (merge pipeline invariant).

## Top 50 plants by country coverage

| Rank | plant_id | countries | scientific_name |
| ---: | --- | ---: | --- |
| 1 | `matricaria_chamomilla` | 31 | Matricaria chamomilla L. |
| 2 | `urtica_dioica` | 27 | Urtica dioica L. |
| 3 | `thymus_vulgaris` | 23 | Thymus vulgaris L. |
| 4 | `ocimum_basilicum` | 22 | Ocimum basilicum L. |
| 5 | `taraxacum_officinale` | 20 | Taraxacum officinale F.H.Wigg. |
| 6 | `lavandula_angustifolia` | 19 | Lavandula angustifolia Mill. |
| 7 | `melissa_officinalis` | 19 | Melissa officinalis L. |
| 8 | `plantago_major` | 19 | Plantago major L. |
| 9 | `rosmarinus_officinalis` | 19 | Rosmarinus officinalis L. |
| 10 | `salvia_officinalis` | 19 | Salvia officinalis L. |
| 11 | `arnica_montana` | 18 | Arnica montana L. |
| 12 | `cymbopogon_citratus` | 18 | Cymbopogon citratus (DC.) Stapf |
| 13 | `foeniculum_vulgare` | 18 | Foeniculum vulgare Mill. |
| 14 | `mentha_spicata` | 18 | Mentha spicata L. |
| 15 | `aloe_vera` | 17 | Aloe vera (L.) Burm. f. |
| 16 | `calendula_officinalis` | 17 | Calendula officinalis L. |
| 17 | `origanum_vulgare` | 17 | Origanum vulgare subsp. hirtum |
| 18 | `sambucus_nigra` | 17 | Sambucus nigra L. |
| 19 | `silybum_marianum` | 17 | Silybum marianum |
| 20 | `zingiber_officinale` | 17 | Zingiber officinale |
| 21 | `allium_sativum` | 16 | Allium sativum |
| 22 | `echinacea_purpurea` | 16 | Echinacea purpurea |
| 23 | `ginkgo_biloba` | 16 | Ginkgo biloba |
| 24 | `laurus_nobilis` | 16 | Laurus nobilis |
| 25 | `cinnamomum_verum` | 15 | Cinnamomum verum |
| 26 | `hibiscus_sabdariffa` | 15 | Hibiscus sabdariffa |
| 27 | `moringa_oleifera` | 15 | Moringa oleifera |
| 28 | `valeriana_officinalis` | 15 | Valeriana officinalis L. |
| 29 | `arthrospira_platensis` | 14 | Arthrospira platensis |
| 30 | `aspalathus_linearis` | 14 | Aspalathus linearis |
| 31 | `camellia_sinensis` | 14 | Camellia sinensis (matcha) |
| 32 | `coriandrum_sativum` | 14 | Coriandrum sativum |
| 33 | `curcuma_longa` | 14 | Curcuma longa |
| 34 | `ilex_paraguariensis` | 14 | Ilex paraguariensis |
| 35 | `mentha_` | 14 | Mentha × piperita |
| 36 | `mentha_x` | 14 | Mentha x piperita |
| 37 | `ocimum_tenuiflorum` | 14 | Ocimum tenuiflorum |
| 38 | `panax_ginseng` | 14 | Panax ginseng |
| 39 | `paullinia_cupana` | 14 | Paullinia cupana |
| 40 | `petroselinum_crispum` | 14 | Petroselinum crispum |
| 41 | `pimpinella_anisum` | 14 | Pimpinella anisum L. |
| 42 | `psidium_guajava` | 14 | Psidium guajava L. |
| 43 | `ruta_graveolens` | 14 | Ruta graveolens L. |
| 44 | `stevia_rebaudiana` | 14 | Stevia rebaudiana Bertoni |
| 45 | `syzygium_aromaticum` | 14 | Syzygium aromaticum |
| 46 | `withania_somnifera` | 14 | Withania somnifera |
| 47 | `artemisia_absinthium` | 13 | Artemisia absinthium L. |
| 48 | `asclepias_curassavica` | 13 | Asclepias curassavica L. |
| 49 | `bidens_pilosa` | 13 | Bidens pilosa L. |
| 50 | `equisetum_arvense` | 13 | Equisetum arvense L. |

## Top mismatches between global dominant vs regional dominant

For each plant with ≥3 countries, the **global** dominant label is the hub with the widest geographic footprint (`country_usage` or legacy `countries`; then shorter name). The **regional** dominant for ISO `C` is the row among those listing `C` with highest score: `+2` if `C` is present, `+ 0.3 × hub width`, `- 0.01 × label.length`; ties → shorter `name`, then `normalized`.

### Plants with the most mismatching countries

| plant_id | mismatching countries |
| --- | ---: |
| `matricaria_chamomilla` | 26 |
| `urtica_dioica` | 26 |
| `thymus_vulgaris` | 21 |
| `taraxacum_officinale` | 20 |
| `calendula_officinalis` | 16 |
| `origanum_vulgare` | 16 |
| `salvia_officinalis` | 16 |
| `silybum_marianum` | 16 |
| `laurus_nobilis` | 15 |
| `foeniculum_vulgare` | 14 |
| `mentha_spicata` | 14 |
| `ocimum_basilicum` | 14 |
| `coriandrum_sativum` | 13 |
| `cymbopogon_citratus` | 13 |
| `petroselinum_crispum` | 13 |
| `syzygium_aromaticum` | 13 |
| `zingiber_officinale` | 13 |
| `arthrospira_platensis` | 12 |
| `sambucus_nigra` | 12 |
| `valeriana_officinalis` | 12 |
| `echinacea_purpurea` | 10 |
| `artemisia_absinthium` | 8 |
| `equisetum_arvense` | 8 |
| `hypericum_perforatum` | 8 |
| `ilex_paraguariensis` | 8 |

### Sample rows (first 40)

| plant_id | country | global label | regional label |
| --- | --- | --- | --- |
| `acca_sellowiana` | UY | Feijoa | Guayabo del país |
| `achillea_millefolium` | AT | Yarrow | Schafgarbe |
| `achillea_millefolium` | BG | Yarrow | Common yarrow |
| `achillea_millefolium` | BR | Yarrow | Novalgina |
| `achillea_millefolium` | CL | Yarrow | Milenrama |
| `achillea_millefolium` | CO | Yarrow | Milenrama |
| `achillea_millefolium` | RO | Yarrow | Duodela |
| `acorus_calamus` | CZ | Ratroot | pišišvor |
| `ageratum_conyzoides` | BR | Altamisa | Mentrasto |
| `allium_cepa` | CO | Onion | Cebolla |
| `allium_cepa` | PE | Onion | Cebolla |
| `allium_sativum` | BR | Ajo | Alho |
| `allium_sativum` | CA | Ajo | Garlic |
| `allium_sativum` | IT | Ajo | Aglio |
| `allium_sativum` | US | Ajo | Garlic |
| `aloe_vera` | BR | Aloe | Babosa |
| `aloe_vera` | ES | Aloe | Sábila |
| `aloe_vera` | MX | Aloe | Sábila |
| `aloe_vera` | VE | Aloe | Sábila |
| `aloysia_citrodora` | CO | Cedrón | Cidron |
| `alternanthera_pungens` | AR | Sanguinaria | Yerba del pollo |
| `alternanthera_pungens` | UY | Sanguinaria | Yerba del pollo |
| `althaea_officinalis` | FR | Altea | Guimauve |
| `althaea_officinalis` | RO | Altea | malva |
| `amaranthus_hybridus` | AR | Achis | Yuyo colorado |
| `anacardium_occidentale` | BO | Caju | Cayu |
| `anacardium_occidentale` | BR | Caju | Cajueiro |
| `ananas_comosus` | AR | Piña | Ananá |
| `angelica_archangelica` | AR | Kvan | Angélica |
| `angelica_archangelica` | AT | Kvan | Engelwurz |
| `angelica_archangelica` | FR | Kvan | Angélique |
| `annona_muricata` | BR | Soursop | Graviola |
| `annona_muricata` | CO | Soursop | Guanábana |
| `annona_muricata` | PE | Soursop | Guanábana |
| `annona_squamosa` | BR | Anón | Fruta-do-conde |
| `annona_squamosa` | PE | Anón | Anona |
| `arctium_lappa` | CL | Čičak | Bardana |
| `arctium_lappa` | RO | Čičak | Riborasta |
| `aristolochia_trilobata` | CO | epák | Bejuco de culebra |
| `arnica_montana` | AT | Árnica | Arnika |
| … | (730 more) | | |

## Same common-name hub → different species (conflicts)

These hubs intentionally keep multiple rows (disambiguation in UI). Listed for QA.

| normalized | example label | #species | scientific_names |
| --- | --- | ---: | --- |
| `santa_maria` | Santa María | 8 | Baccharis trinervis; Calophyllum brasiliense; Lippia alba (Mill.) N.E. Br. ex Britton & P. Wilson; Piper auritum Kunth; Piper peltatum; Piper umbellatum; Pluchea odorata (L.) Cass.; Vernonanthura patens |
| `lengua_de_vaca` | Lengua de vaca | 7 | Baccharis trinervis; Chaptalia nutans; Curatella americana; Elephantopus mollis; Rumex conglomeratus; Rumex crispus; Rumex obtusifolius |
| `cedron` | Cedrón | 6 | Aloysia citriodora; Aloysia citrodora Palau; Aloysia triphylla (L'Hér.) Britton; Cymbopogon citratus (DC.) Stapf; Lippia alba (Mill.) N.E. Br. ex Britton & P. Wilson; Lippia citriodora |
| `oregano` | Orégano | 6 | Lippia alba (Mill.) N.E. Br. ex Britton & P. Wilson; Lippia graveolens; Lippia micromera; Origanum majoricum; Origanum vulgare subsp. hirtum; Plectranthus amboinicus (Lour.) Spreng. |
| `salvia` | Salvia | 6 | Buddleia americana; Callicarpa acuminata; Lippia alba (Mill.) N.E. Br. ex Britton & P. Wilson; Pluchea carolinensis; Salvia leucantha Cav.; Salvia officinalis L. |
| `arnica` | arnica | 5 | arnica_chamissonis; arnica_cordifolia; Arnica montana L.; Chaptalia nutans; Tithonia diversifolia (Hemsl.) A. Gray |
| `cadillo` | Cadillo | 5 | Acaena magellanica; Bidens pilosa L.; Cenchrus echinatus; Commelina erecta; Xanthium cavanillesii |
| `guaco` | Guaco | 5 | Aristolochia maxima; Aristolochia odoratissima; Cissampelos pareira L.; Mikania glomerata; Mikania periplocifolia |
| `insulina` | Insulina | 5 | Costus igneus; Costus pictus; Justicia secunda; Justicia spicigera; Piper auritum Kunth |
| `poleo` | Poleo | 5 | Clinopodium brownei; Lippia turbinata; Lippia turpina; Mentha pulegium L.; Mentha viridis L. |
| `sauco` | Saúco | 5 | Sambucus australis; Sambucus canadensis; Sambucus mexicana C. Presl ex DC.; Sambucus nigra L.; Sambucus peruviana |
| `tilo` | Tilo | 5 | Justicia pectoralis; Sambucus nigra L.; Tilia cordata Mill.; Tilia sp.; Tilia spp. |
| `una_de_gato` | Uña de gato | 5 | Celtis iguanaea; Martynia annua; Mulinum spinosum; Uncaria guianensis; Uncaria tomentosa |
| `valeriana` | Valeriana | 5 | Chaptalia nutans; Chrysopogon zizanioides; Momordica charantia L.; Valeriana officinalis L.; Valeriana pilosa |
| `zarzaparrilla` | Zarzaparrilla | 5 | Ribes cucullatum; Smilax campestris; Smilax officinalis; Smilax sp.; Smilax spinosa |
| `amargon` | Amargón | 4 | Calea urticifolia; Chaptalia nutans; Sonchus oleraceus; Taraxacum officinale F.H.Wigg. |
| `amor_seco` | Amor seco | 4 | Bidens andicola; Bidens pilosa L.; Desmodium adscendens; Desmodium uncinatum |
| `arrayan` | Arrayán | 4 | Blepharocalyx salicifolius; Luma chequen (Mol.) A. Gray; Myrcianthes cisplatensis; Myrcianthes hallii |
| `chilca` | Chilca | 4 | Baccharis latifolia; Baccharis trinervis; Eupatorium buniifolium; Eupatorium inulifolium |
| `contrayerba` | Contrayerba | 4 | Aristolochia didyma; Dorstenia brasiliensis; Dorstenia contrajerva; Flaveria bidentis |
| `hierba_dulce` | Hierba dulce | 4 | Calceolaria thyrsiflora; Lippia dulcis; Phyla dulcis; Stevia rebaudiana Bertoni |
| `hierba_luisa` | Hierba luisa | 4 | Aloysia citriodora; Aloysia citrodora Palau; Aloysia triphylla (L'Hér.) Britton; Cymbopogon citratus (DC.) Stapf |
| `malva` | malva | 4 | Althaea officinalis; Malva parviflora; Malva sylvestris L.; Malvaviscus arboreus |
| `matico` | Matico | 4 | Aristeguietia glutinosa; Buddleja americana; Buddleja globosa; Piper aduncum |
| `menta` | Menta | 4 | Mentha × piperita; Mentha piperita; Mentha spicata L.; Mentha x piperita |
| `molle` | Molle | 4 | Lithraea molleoides; Schinus areira; Schinus molle L.; Schinus terebinthifolius |
| `pasiflora` | Pasiflora | 4 | Passiflora caerulea; Passiflora edulis; Passiflora incarnata; Passiflora quadrangularis |
| `pingo_pingo` | Pingo pingo | 4 | Ephedra americana; Ephedra chilensis; Ephedra ochreata; Ephedra triandra |
| `quina` | Quina | 4 | Cinchona officinalis; Cinchona pubescens; Coutarea hexandra; Quassia amara |
| `siempre_viva` | Siempre viva | 4 | Bryophyllum pinnatum; Gomphrena globosa; Gomphrena perennis; Peperomia pellucida |
| `suelda_con_suelda` | Suelda con suelda | 4 | Anredera vesicaria; Commelina erecta; Psittacanthus calyculatus; Symphytum officinale |
| `valeriana_andina` | Valeriana andina | 4 | Perezia coerulescens; Perezia pinnatifida; Valeriana carnosa; Valeriana nivalis |
| `verbena` | Verbena | 4 | Scoparia dulcis; Verbena litoralis; Verbena littoralis; Verbena officinalis |
| `vira_vira` | Vira vira | 4 | Achyrocline satureioides; Gnaphalium gaudichaudianum; Gnaphalium spicatum; Pseudognaphalium viravira |
| `agracejo` | Agracejo | 3 | Berberis boliviana; Berberis goudotii; Berberis vulgaris |
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
| `cana_agria` | Caña agria | 3 | Costus pictus; Costus scaber; Costus spicatus |
| `caraguata` | Caraguatá | 3 | Bromelia serra; Eryngium horridum; Eryngium paniculatum |
| `cola_de_caballo` | Cola de Caballo | 3 | Equisetum arvense L.; Equisetum bogotense; Equisetum giganteum |
| `coralillo` | Coralillo | 3 | Erythrina berteroana; Hamelia patens Jacq.; Rivina humilis |
| `cuasia` | Cuasia | 3 | Picrasma crenata; Quassia amara; Quassia simaruba |
| `dogwood` | dogwood | 3 | cornus_florida; Cornus sericea; cornus_spp |
| `echinacea` | Echinacea | 3 | Echinacea angustifolia; Echinacea pallida; Echinacea purpurea |
| `escobilla` | Escobilla | 3 | Baccharis conferta Kunth; Hyptis suaveolens; Scoparia dulcis |
| `evening_primrose` | evening primrose | 3 | oenothera_biennis; oenothera_caespitosa; oenothera_speciosa |
| `ginseng` | ginseng | 3 | eleutherococcus_senticosus; Panax ginseng; Panax quinquefolius |
| `goldenrod` | Goldenrod | 3 | Solidago canadensis; Solidago odora; solidago_speciosa |
| `grama` | Grama | 3 | Cynodon dactylon; Elymus repens; Paspalum notatum |
| `hierba_de_san_juan` | Hierba de San Juan | 3 | Hypericum laricifolium; Hypericum perforatum L.; Tagetes lucida Cav. |
| `hierba_del_cancer` | Hierba del cáncer | 3 | Acalypha arvensis; Cuphea aequipetala Cav.; Hamelia patens Jacq. |
| `hoja_blanca` | Hoja Blanca | 3 | Buddleia americana; Buddleja americana; Calathea lutea |
| `juniper` | juniper | 3 | Juniperus communis L.; juniperus_monosperma; juniperus_virginiana |
| `mastranto` | Mastranto | 3 | Hyptis mutabilis; Hyptis suaveolens; Lippia alba (Mill.) N.E. Br. ex Britton & P. Wilson |
| `mastuerzo` | Mastuerzo | 3 | Capsella bursa-pastoris; Coronopus didymus; Lepidium didymum |
| `matricaria` | Matricaria | 3 | Matricaria chamomilla L.; Matricaria recutita L.; Tanacetum parthenium (L.) Sch. Bip. |
| `menta_piperita` | Menta piperita | 3 | Mentha × piperita; Mentha piperita; Mentha x piperita |
| `milkweed` | milkweed | 3 | asclepias_incarnata; asclepias_syriaca; asclepias_tuberosa |
| `mint` | mint | 3 | Mentha arvensis; Mentha spicata L.; Mentha x piperita |
| `mountain_mint` | mountain mint | 3 | pycnanthemum_muticum; pycnanthemum_tenuifolium; pycnanthemum_virginianum |
| `oak` | oak | 3 | quercus_alba; quercus_rubra; quercus_spp |
| `ortiga` | Ortiga | 3 | Urera baccifera (L.) Gaudich. ex Wedd.; Urtica dioica L.; Urtica urens |
| `ortiga_brava` | Ortiga brava | 3 | Caiophora lateritia; Urera baccifera (L.) Gaudich. ex Wedd.; Urtica urens |
| `paico` | Paico | 3 | Chenopodium ambrosioides; Chenopodium chilense; Dysphania ambrosioides (L.) Mosyakin & Clemants |
| `palo_santo` | Palo santo | 3 | Bulnesia sarmientoi; Bursera graveolens; Erythrina fusca |
| `pasionaria` | Pasionaria | 3 | Passiflora caerulea; Passiflora edulis; Passiflora incarnata |
| `peppermint` | Peppermint | 3 | Mentha × piperita; Mentha piperita; Mentha x piperita |
| `pine` | pine | 3 | pinus_resinosa; pinus_spp; pinus_strobus |
| `sage` | sage | 3 | salvia_apiana; salvia_columbariae; Salvia officinalis L. |
| … | (192 more) | | |

## Row fields (processed + bundled names)

**Plant-level** (when `plant_country_span` ≥ 3):

- `plant_country_span`: distinct ISO codes for the plant (names ∪ `plants.json` regions).
- `plant_authority_tier`: `cross_regional` if span ≥ 3; `cosmopolitan` if span ≥ 15.
- `plant_name_variants`: other indexed labels for the same plant.

**Name-level** (all rows):

- `name_country_count`: number of distinct ISO codes on this hub row (`country_usage` or `countries`).
- `is_global_dominant_name`: true on one row per multi-country plant (widest hub coverage).
- `dominant_in_countries`: ISO list where this row wins the per-country competition for that plant.
