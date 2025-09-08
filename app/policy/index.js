const { AbilityBuilder, createMongoAbility } = require('@casl/ability');

const policies = {
    guest(user, { can }) {
        can('read', 'Product');
    },
    user(user, { can }) {
        can('view', 'Order');

        can('create', 'Order');

        can('read', 'Order', { user_id: user._id });

        can('update', 'Order', { _id: user._id });

        can('read', 'Cart', { user_id: user._id });

        can('update', 'Cart', { user_id: user._id });

        can('view', 'DeliveryAddress');
        can('create', 'DeliveryAddress', { user_id: user._id });

        can('read', 'DeliveryAddress', { user_id: user._id });

        can('update', 'DeliveryAddress', { user_id: user._id });

        can('delete', 'DeliveryAddress', { user_id: user._id });

        can('read', 'Invoice', { user_id: user._id });
    },
    admin(user, { can }) {
        can('manage', 'all');
    },
};

const policyFor = user => {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);
    
    if (user && typeof policies[user.role] === 'function') {
        policies[user.role](user, { can, cannot });
    } else {
        policies['guest'](user, { can, cannot });
    }
    
    return build();
};


module.exports = {
 policyFor
}