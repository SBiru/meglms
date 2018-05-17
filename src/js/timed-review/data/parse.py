#!/usr/bin/env python
import wave
import os
import sys
from os.path import join, dirname
import json

base = join(dirname(__file__), 'conversations')

def parse_conversation(name):
    if not name.endswith('.txt'): return
    text = open(join(base, name)).read().split('\n')
    title = text.pop(0)
    sections = []
    section = None

    for line in text:
        if not line.strip(): continue
        start = line[0]
        line = line[1:].strip()
        if start == '<':
            if section is None:
                raise Exception('no section')
            section['answers'].append(line)
        elif start == '>':
            section = {'prompt': line, 'prompt_audio': None, 'answers': [], 'answer_audio': None}
            sections.append(section)
        elif start == '~':
            section['answer_audio'] = line
            section['answer_duration'] = get_duration(line)
        elif start == '*':
            section['prompt_audio'] = line
            section['prompt_duration'] = get_duration(line)
    return {'title': title, 'dialog': sections}

def get_duration(name):
    f = wave.open(join(dirname(__file__), 'audio', name))
    frames = f.getnframes()
    rate = f.getframerate()
    duration = frames / float(rate)
    return duration

conversations = map(parse_conversation, filter(lambda n: n.endswith('.txt'), os.listdir(base)))
open(join(dirname(__file__), 'conversations.json'), 'w').write(json.dumps(conversations, indent=2))

# vim: et sw=4 sts=4
