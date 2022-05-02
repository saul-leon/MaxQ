
class CalculatorPlugin:
    
    search_operator = '='
    
    def __init__(self):
        pass
    
    def exec(self, query):
        
        try:
            output = str(eval(query))
        except:
            output = 'Worng Syntax'
        
        return [
            {
                "name": "Calculator",
                "type": "front",
                "preview": "<p>Calculator (Pluging)</p><h2>"+ output +"</h2>",
                "cmd": "copy",
                "params": [output]
            }               
        ]
        
