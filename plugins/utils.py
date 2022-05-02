def load_plugins(plugins_dir, plugins_names):
    plugins = {}
    for plugin_name in plugins_names:
        module = __import__( plugins_dir + '.' + plugin_name)
        module = getattr(module, plugin_name)
        clazz = getattr(module, plugin_name)
        instance = clazz()
        plugins[ instance.search_operator ] = instance
    return plugins


def remove_search_operator(query_input, search_operator):
    start_index = query_input.index(search_operator) + len(search_operator)
    return query_input[ start_index : ]