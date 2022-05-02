import keyboard

class KeyboardPlugin:
    
    search_operator = 'keyboard:'
    
    def __init__(self):
        keyboard.add_abbreviation('@@', 'user.name@company.com')
        
    def exec(self, query):
        
        return [
            {
                "name": "Keyboard",
                "type": "front",
                "preview": "<p>Keyboard (Pluging)</p><h2>"+ query +"</h2>",
                "cmd": "copy",
                "params": [query]
            }
        ]
        
