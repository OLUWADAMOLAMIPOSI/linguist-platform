-- 007_ipa_reference_data.sql
-- Reference data: the standard IPA pulmonic consonants, selected other consonants and vowels.
-- This is general phonetic reference information, not research data. Admins can edit
-- descriptions and attach audio examples from the dashboard.

insert into public.ipa_symbols (symbol, name, category, place, manner, voicing, sort_order)
select
  v.symbol,
  initcap(v.voicing) || ' ' || v.place || ' ' || v.manner,
  v.category,
  v.place,
  v.manner,
  v.voicing,
  row_number() over () * 10
from (values
  -- plosives
  ('p', 'voiceless', 'bilabial', 'plosive', 'consonant'),
  ('b', 'voiced', 'bilabial', 'plosive', 'consonant'),
  ('t', 'voiceless', 'alveolar', 'plosive', 'consonant'),
  ('d', 'voiced', 'alveolar', 'plosive', 'consonant'),
  ('ʈ', 'voiceless', 'retroflex', 'plosive', 'consonant'),
  ('ɖ', 'voiced', 'retroflex', 'plosive', 'consonant'),
  ('c', 'voiceless', 'palatal', 'plosive', 'consonant'),
  ('ɟ', 'voiced', 'palatal', 'plosive', 'consonant'),
  ('k', 'voiceless', 'velar', 'plosive', 'consonant'),
  ('ɡ', 'voiced', 'velar', 'plosive', 'consonant'),
  ('q', 'voiceless', 'uvular', 'plosive', 'consonant'),
  ('ɢ', 'voiced', 'uvular', 'plosive', 'consonant'),
  ('ʔ', 'voiceless', 'glottal', 'plosive', 'consonant'),
  -- nasals
  ('m', 'voiced', 'bilabial', 'nasal', 'consonant'),
  ('ɱ', 'voiced', 'labiodental', 'nasal', 'consonant'),
  ('n', 'voiced', 'alveolar', 'nasal', 'consonant'),
  ('ɳ', 'voiced', 'retroflex', 'nasal', 'consonant'),
  ('ɲ', 'voiced', 'palatal', 'nasal', 'consonant'),
  ('ŋ', 'voiced', 'velar', 'nasal', 'consonant'),
  ('ɴ', 'voiced', 'uvular', 'nasal', 'consonant'),
  -- trills
  ('ʙ', 'voiced', 'bilabial', 'trill', 'consonant'),
  ('r', 'voiced', 'alveolar', 'trill', 'consonant'),
  ('ʀ', 'voiced', 'uvular', 'trill', 'consonant'),
  -- taps and flaps
  ('ⱱ', 'voiced', 'labiodental', 'tap or flap', 'consonant'),
  ('ɾ', 'voiced', 'alveolar', 'tap or flap', 'consonant'),
  ('ɽ', 'voiced', 'retroflex', 'tap or flap', 'consonant'),
  -- fricatives
  ('ɸ', 'voiceless', 'bilabial', 'fricative', 'consonant'),
  ('β', 'voiced', 'bilabial', 'fricative', 'consonant'),
  ('f', 'voiceless', 'labiodental', 'fricative', 'consonant'),
  ('v', 'voiced', 'labiodental', 'fricative', 'consonant'),
  ('θ', 'voiceless', 'dental', 'fricative', 'consonant'),
  ('ð', 'voiced', 'dental', 'fricative', 'consonant'),
  ('s', 'voiceless', 'alveolar', 'fricative', 'consonant'),
  ('z', 'voiced', 'alveolar', 'fricative', 'consonant'),
  ('ʃ', 'voiceless', 'postalveolar', 'fricative', 'consonant'),
  ('ʒ', 'voiced', 'postalveolar', 'fricative', 'consonant'),
  ('ʂ', 'voiceless', 'retroflex', 'fricative', 'consonant'),
  ('ʐ', 'voiced', 'retroflex', 'fricative', 'consonant'),
  ('ç', 'voiceless', 'palatal', 'fricative', 'consonant'),
  ('ʝ', 'voiced', 'palatal', 'fricative', 'consonant'),
  ('x', 'voiceless', 'velar', 'fricative', 'consonant'),
  ('ɣ', 'voiced', 'velar', 'fricative', 'consonant'),
  ('χ', 'voiceless', 'uvular', 'fricative', 'consonant'),
  ('ʁ', 'voiced', 'uvular', 'fricative', 'consonant'),
  ('ħ', 'voiceless', 'pharyngeal', 'fricative', 'consonant'),
  ('ʕ', 'voiced', 'pharyngeal', 'fricative', 'consonant'),
  ('h', 'voiceless', 'glottal', 'fricative', 'consonant'),
  ('ɦ', 'voiced', 'glottal', 'fricative', 'consonant'),
  -- lateral fricatives
  ('ɬ', 'voiceless', 'alveolar', 'lateral fricative', 'consonant'),
  ('ɮ', 'voiced', 'alveolar', 'lateral fricative', 'consonant'),
  -- approximants
  ('ʋ', 'voiced', 'labiodental', 'approximant', 'consonant'),
  ('ɹ', 'voiced', 'alveolar', 'approximant', 'consonant'),
  ('ɻ', 'voiced', 'retroflex', 'approximant', 'consonant'),
  ('j', 'voiced', 'palatal', 'approximant', 'consonant'),
  ('ɰ', 'voiced', 'velar', 'approximant', 'consonant'),
  -- lateral approximants
  ('l', 'voiced', 'alveolar', 'lateral approximant', 'consonant'),
  ('ɭ', 'voiced', 'retroflex', 'lateral approximant', 'consonant'),
  ('ʎ', 'voiced', 'palatal', 'lateral approximant', 'consonant'),
  ('ʟ', 'voiced', 'velar', 'lateral approximant', 'consonant'),
  -- other consonants (double or secondary articulations)
  ('w', 'voiced', 'labial-velar', 'approximant', 'other_consonant'),
  ('ɥ', 'voiced', 'labial-palatal', 'approximant', 'other_consonant'),
  ('ʍ', 'voiceless', 'labial-velar', 'fricative', 'other_consonant'),
  ('ɕ', 'voiceless', 'alveolo-palatal', 'fricative', 'other_consonant'),
  ('ʑ', 'voiced', 'alveolo-palatal', 'fricative', 'other_consonant')
) as v(symbol, voicing, place, manner, category)
on conflict (symbol) do nothing;

insert into public.ipa_symbols (symbol, name, category, height, backness, rounded, sort_order)
select
  v.symbol,
  upper(left(v.height, 1)) || substr(v.height, 2) || ' ' || v.backness || ' ' || case when v.rounded then 'rounded' else 'unrounded' end || ' vowel',
  'vowel',
  v.height,
  v.backness,
  v.rounded,
  1000 + row_number() over () * 10
from (values
  ('i', 'close', 'front', false),
  ('y', 'close', 'front', true),
  ('ɨ', 'close', 'central', false),
  ('ʉ', 'close', 'central', true),
  ('ɯ', 'close', 'back', false),
  ('u', 'close', 'back', true),
  ('ɪ', 'near-close', 'front', false),
  ('ʏ', 'near-close', 'front', true),
  ('ʊ', 'near-close', 'back', true),
  ('e', 'close-mid', 'front', false),
  ('ø', 'close-mid', 'front', true),
  ('ɘ', 'close-mid', 'central', false),
  ('ɵ', 'close-mid', 'central', true),
  ('ɤ', 'close-mid', 'back', false),
  ('o', 'close-mid', 'back', true),
  ('ə', 'mid', 'central', false),
  ('ɛ', 'open-mid', 'front', false),
  ('œ', 'open-mid', 'front', true),
  ('ɜ', 'open-mid', 'central', false),
  ('ɞ', 'open-mid', 'central', true),
  ('ʌ', 'open-mid', 'back', false),
  ('ɔ', 'open-mid', 'back', true),
  ('æ', 'near-open', 'front', false),
  ('ɐ', 'near-open', 'central', false),
  ('a', 'open', 'front', false),
  ('ɶ', 'open', 'front', true),
  ('ɑ', 'open', 'back', false),
  ('ɒ', 'open', 'back', true)
) as v(symbol, height, backness, rounded)
on conflict (symbol) do nothing;

-- Positional notes for the three near-close vowels
update public.ipa_symbols set description = 'Positioned between front and central on the standard IPA chart (near-front).'
  where symbol in ('ɪ', 'ʏ');
update public.ipa_symbols set description = 'Positioned between central and back on the standard IPA chart (near-back).'
  where symbol = 'ʊ';
