# Reference materials (retrieved 2026-10-22)

Only US government works and NCVEC public-domain releases are stored here, plus the license and README files from one Apache-2.0 repository. No commercial study guides are included.

## Contents

- `ecfr/` contains 47 CFR Part 97 from the eCFR Versioner API.
  - `97_501.xml`, `97_503.xml`, `97_505.xml`, `97_507.xml`, `97_509.xml`, `97_523.xml` are single sections fetched with
    `https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-47.xml?part=97&section=97.5xx`
  - `part97_subpartF.xml` and `part97_subpartF.md` contain Subpart F (Qualifying Examination Systems), fetched with `...?part=97&subpart=F`. The `.md` file is the readable text.
  - `part97_full.xml` is all of Part 97 (about 190 KB), fetched with `...?part=97`.
  - `ecfr_versions.json` comes from `https://www.ecfr.gov/api/versioner/v1/versions/title-47.json?part=97`. The latest Part 97 amendment date is 2026-02-13.
  - The API rejects requests that do not allow compression (HTTP 406), so use `curl --compressed`.
- `fcc_examinations_extract.txt` is text from the FCC Amateur Radio Service examinations page.
- `ncvec_amateur_question_pools_extract.txt` is text from the NCVEC question pool policy page.
- `ncvec_{technician_2026-2030,general_2023-2027,extra_2024-2028}_release_extract.txt` are text from the three NCVEC pool release pages, including errata history and public-domain release statements.
- `raw-html/` holds the original HTML for all of the pages above.
- `figures/` holds official NCVEC diagram files. `curl_head_results.txt` records the `curl -I` checks, and `urls.txt` lists the source URLs.
- `russolsen_ham_radio_question_pool/` contains `LICENSE.txt` (Apache-2.0), `readme.md`, `working_readme.md`, `repo_tree.txt` (file listing at commit 6122699c), and `sample_figures/` (three PNGs used for comparison).

## Passing scores (47 CFR 97.503; the FCC examinations page shows the same values)

| Element | License class | Questions | Minimum correct to pass |
|---|---|---|---|
| 2 | Technician | 35 | 26 |
| 3 | General | 35 | 26 |
| 4 | Amateur Extra | 50 | 37 |

Required elements for each license: Technician requires Element 2. General requires Elements 2 and 3. Amateur Extra requires Elements 2, 3, and 4. Under 97.523, each pool must contain at least 10 times the number of questions on one exam and must be published before it is used.

## NCVEC pool structure

According to the NCVEC policy page, each element syllabus has four parts: subelements (T1, G1, E1, and so on, usually 10 per pool), subtopic groups (T1A), questions (T1A01), and the diagrams used on exams. The public pool shows the correct answer letter in parentheses after each question ID, sometimes followed by a rule citation, for example `T1A01 (C) [97.1]`. The actual exam does not show the answer letter or the rule citation. Each release page says the QPC "hereby releases into public domain" that pool. Deleted questions are marked as deleted and are not renumbered.

## Official figure files

- Technician 2026-2030: `2026-2030 Technician Pool 3 Diagrams.pdf` (contains T-1, T-2, and T-3), plus `Technician Diagram T1.jpg`, `Technician Diagram T2.jpg`, and `Technician Diagram T3.jpg`.
- General 2023-2027: `G7-1.pdf` (contains G7-1). The JPG link on the release page returns 404.
- Extra 2024-2028: `Extra_Figures_2024-2028-1.pdf` (contains E5-1, E6-1, E6-2, E6-3, E7-1, E7-2, E7-3, E9-1, E9-2, and E9-3), `e4_2024-svgs.zip` (unpacked into `extra_svgs/E5-1.svg` through `E9-3.svg`), and `2024-2028 Amateur Extra Class Pool Diagrams_Page_1.jpg`, `_Page_2.jpg`, and `_Page_3_V2.jpg`. E9-3 is the Smith chart, which was rotated in the January 2024 errata.

## Reuse policy

We may ship the full NCVEC question pools: question text, answer choices, answer keys, syllabus structure, rule citations, and the official diagrams (T-1 to T-3, G7-1, E5-1 to E9-3). NCVEC explicitly released these into the public domain. We may also quote or paraphrase FCC and eCFR text, because works of the US government are not subject to copyright. Attribution is courtesy rather than a requirement. If we reuse russolsen's JSON, YAML, or CSV conversions or his PNG files, we should keep an Apache-2.0 notice; the underlying content is still the NCVEC public-domain material. The repo PNGs are raster copies of the NCVEC figures: T-1 matches visually, but the file bytes differ from the official JPG. For that reason, prefer the official PDF, JPG, and SVG files here.

We must not copy explanations, mnemonics, hints, illustrations, or study text from the ARRL License Manuals, Gordon West/W5YI, HamRadioPrep, KB6NU, HamStudy, or other commercial sources. Any explanations we ship must be written by us and based on primary sources such as Part 97 and the pool text.
