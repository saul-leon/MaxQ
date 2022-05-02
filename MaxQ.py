#-*- coding: utf-8 -*-
from functools import reduce
import json
import os
import re

# __ Plugings __
from plugins.utils import *
PLUGINS = load_plugins('plugins', [
    'CalculatorPlugin',
    'KeyboardPlugin'
])

# __ Commands __
CATEGORIES_COMMANDS = json.load(open('commands.json'))
_trim = lambda txt: (re.compile('[^a-zA-Z]')).sub('', txt.upper())

def search(query_input):
    
    results = []
    
    # __ Plugings __
    query = query_input.strip()
    
    for search_operator in PLUGINS:
        items = []
        
        if query.startswith(search_operator):
            items = items + PLUGINS[ search_operator ].exec(
                remove_search_operator(query_input, search_operator)
            )
            
        if items:
            results.append({
                'name': 'Pluging',
                'items': items
            })
    
    query = _trim(query_input)
    
    if len(query) > 0:    
        # __ Commands __
        for category in CATEGORIES_COMMANDS:

            items = []

            for item in category['items']:

                command = _trim(category['name'] + item['name'])
                matching = 0

                k_query = 0
                ln_query = len(query)
                k_command = 0
                ln_command = len(command)

                while k_query < ln_query:
                    while k_command < ln_command:
                        if query[k_query] == command[k_command]:
                            matching+= 1
                            k_query+= 1
                            if k_query == ln_query:
                                break
                        k_command+= 1
                    k_query+= 1
                
                if matching == ln_query:
                    if not 'preview' in item:
                        item['preview'] = category['generic_preview']
                    items.append(item)

            if items:
                results.append({
                    'name': category['name'],
                    'items': items
                })
        
        # TODO: Ranking by Usage Stats
        
    return results

# __ Plugins __
def run(params):
    cmd = 'CALL START /B "MaxQ_RUNNER" "%s"' % params[0]
    print(cmd)
    os.system(cmd)
    return {'ok': True}

# __ Server __
from flask import Flask, request, jsonify
app = Flask(__name__, static_url_path='', static_folder='www')

@app.route('/')
def root():
    return app.send_static_file('index.html')

@app.route('/v1/search', methods=['POST'])
def v1_search():
    return jsonify( search( request.get_json()['query'] ) )

@app.route('/v1/run', methods=['POST'])
def v1_run():
    return jsonify( run( request.get_json()['params'] ) )

app.run(host='127.0.0.1', port=8100)
