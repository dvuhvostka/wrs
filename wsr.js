/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class FabCar extends Contract {

    async initLedger( ctx ) {
        console.info('============= START : Initialize Ledger ===========');

        const info = {
            users: [
                {
                    id: 0,
                    login: 'gay',
                    fio: 'admin',
                    password: '12345',
                    role: 'admin',
                    authCode: 12345,
                    balance: 0,
                    isAdmin: true
                } 
            ], // users end;
            shops: [
                {
                    id: 0,
                    ownerlogin: 'gay',
                    sellers: [],
                    active: true,
                    comments: [
                        {
                            like: 0,
                            dislike: 0,
                            mark: 0,
                            text: 'test',
                            answers: []
                        }
                    ]
                },
            ], // shops end;
            requests: [
                {
                    id: 0,
                    active: true,
                    shopOwnerLogin: '',
                    requestOwner: 'gay',
                    wantsToBe: 'admin'
                }
            ]
        }

        await ctx.stub.putState( 'info', Buffer.from( JSON.stringify( info ) ) );

        console.info('============= END : Initialize Ledger ===========');
    }

    async getInfo( ctx ) {
        const info = await ctx.stub.getState('info');
        return info.toString( );
    }

    async getUserByLogin( ctx, login ) {
        const info = JSON.parse( await this.getInfo( ctx ) );
        const user = info.users.find( ( user ) => user.login == login );
        const result = JSON.stringify(user);
        return result.toString( );
    }

    async registerUser( ctx, login, fio, password, auth ) {
        
        const user = {
            id: 0,
            login: login,
            fio: fio,
            password: password,
            role: 'buyer',
            authCode: auth,
            balance: 0,
            isAdmin: false
        }

        const info = JSON.parse( await this.getInfo( ctx ) );
        const userId = info.users.length;
        user.id = userId;
        info.users.push( user );
        await ctx.stub.putState( 'info', Buffer.from( JSON.stringify( info ) ) );
        return `User ${user.login} successfuly registered.`;
    }

    async login( ctx, login, password ) {
        
        const user = JSON.parse( await this.getUserByLogin( ctx, login) );
        
        if ( !user ) {
            throw new Error(`${user} does not exist`);
        }
        
        if ( user.password != password ) {
            throw new Error(`Incorrect password.`);
        }

        
        return JSON.stringify( user ).toString();
    }

    async updateBuyerToSeller( ctx, buyerLogin, shopOwnerLogin, adminLogin ) {
        
        const admin = JSON.parse( await this.getUserByLogin( ctx, adminLogin) );
        const buyer = JSON.parse( await this.getUserByLogin( ctx, buyerLogin) );
        
        const shop = JSON.parse( await this.getShopByLogin( ctx, shopOwnerLogin) );

        if( !admin.isAdmin ) {
            throw new Error(`You must be admin to use this.`);
        }

        if ( !buyer ) {
            throw new Error(`${user} does not exist`);
        }

        buyer.role = "seller";

        const info = JSON.parse( await this.getInfo( ctx ) );
        info.users[buyer.id] = buyer;

        info.shops[shop.id].sellers.push( buyer );

        await ctx.stub.putState( 'info', Buffer.from( JSON.stringify( info ) ) );

        return `${buyer.login} was upgraded to seller`;
    }

    async findSellerByShopOwnerLoginAndSellerLogin( ctx, userLogin, shopLogin ) {
        const shop = JSON.parse( await this.getShopByLogin( ctx, shopLogin) );
        const seller = shop.sellers.find( ( seller ) => seller.login = userLogin );
        const kek = JSON.stringify(seller);
        return kek.toString( );
    }

    async decreaseSellerToBuyer( ctx, sellerLogin, shopOwnerLogin, adminLogin ) {
        
        const admin = JSON.parse( await this.getUserByLogin( ctx, adminLogin) );
        const shop = JSON.parse( await this.getShopByLogin( ctx, shopOwnerLogin ) );
        const seller = JSON.parse( await this.getUserByLogin( ctx, sellerLogin) );
        
        if( !admin.isAdmin ) {
            throw new Error(`You must be admin to use this.`);
        }

        if ( !seller ) {
            throw new Error(`${user} does not exist`);
        }

        seller.role = "buyer";

        const info = JSON.parse( await this.getInfo( ctx ) );
        info.users[seller.id] = seller;

        const newSellers = shop.sellers.filter( ( SELLER ) => SELLER.login != seller.login );
        info.shops[shop.id].sellers = newSellers;

        await ctx.stub.putState( 'info', Buffer.from( JSON.stringify( info ) ) );

        return `${buyer.login} was decreased to buyer`;
    }

    async changeAdminRole( ctx, role, adminLogin ) {
        
        const admin = JSON.parse( await this.getUserByLogin( ctx, adminLogin) );
        
        if( !admin.isAdmin ) {
            throw new Error(`You must be admin to use this.`);
        }

        admin.role = role;

        const info = JSON.parse( await this.getInfo( ctx ) );
        info.users[admin.id] = admin;
        await ctx.stub.putState( 'info', Buffer.from( JSON.stringify( info ) ) );
    }

    async createAdmin( ctx, newAdminLogin, adminLogin ) {
        const admin = JSON.parse( await this.getUserByLogin( ctx, adminLogin) );
        const newAdmin = JSON.parse( await this.getUserByLogin( ctx, newAdminLogin) );
        
        if( !admin.isAdmin ) {
            throw new Error(`You must be admin to use this.`);
        }

        if ( !newAdmin ) {
            throw new Error(`${user} does not exist`);
        }

        newAdmin.isAdmin = true;

        const info = JSON.parse( await this.getInfo( ctx ) );
        info.users[newAdmin.id] = newAdmin;
        await ctx.stub.putState( 'info', Buffer.from( JSON.stringify( info ) ) );
    }

    async createShop( ctx, userLogin, adminLogin ) {
        
        const admin = JSON.parse( await this.getUserByLogin( ctx, adminLogin ) );
        const user = JSON.parse( await this.getUserByLogin( ctx, userLogin) );

        if( !admin.isAdmin ) {
            throw new Error(`You must be admin to use this.`);
        }

        if ( !user ) {
            throw new Error(`${user} does not exist`);
        }

        user.role = 'shop';

        const shop = {
            id: 0,
            ownerlogin: user.login,
            sellers: [],
            active: true,
            comments: [
                {
                    like: 0,
                    dislike: 0,
                    mark: 0,
                    answers: []
                }
            ]
        }

        const info = JSON.parse( await this.getInfo( ctx ) );
        const shopId = info.shops.length;
        shop.id = shopId;
        info.shops.push( shop );
        await ctx.stub.putState( 'info', Buffer.from( JSON.stringify( info ) ) );
        
        return `Shop ${user.login} successfuly created.`;
    }

    async getShopByLogin( ctx, ownerLogin ) {
        const info = JSON.parse( await this.getInfo( ctx ) );
        const shop = info.shops.find( ( shop ) => ( (shop.ownerlogin == ownerLogin) && ( shop.active == true ) ) );
        const kek = JSON.stringify(shop);
        return kek.toString( );
    }

    async deleteShop( ctx, shopOwnerLogin, adminLogin ) {
        
        const admin = JSON.parse( await this.getUserByLogin( ctx, adminLogin ) );
        const shop = JSON.parse( await this.getShopByLogin( ctx, shopOwnerLogin ) );
        const shopOwner = JSON.parse( await this.getUserByLogin( ctx, shop.ownerlogin ) );

        if( !admin.isAdmin ) {
            throw new Error(`You must be admin to use this.`);
        }

        if ( !shop ) {
            throw new Error(`${shop} does not exist`);
        }

        const info = JSON.parse( await this.getInfo( ctx ) );
        info.shops[shop.id].active = false;
        shop.sellers.map( ( user ) => {
            info.users[user.id].role = 'buyer';
        } );
        info.users[ shopOwner.id ].role = 'buyer';

        await ctx.stub.putState( 'info', Buffer.from( JSON.stringify( info ) ) );
    }

    async getShopList( ctx ) {
        const info = JSON.parse( await this.getInfo( ctx ) );
        const shops = info.shops.filter( ( shop ) => shop.active == true );
        const result = JSON.stringify( shops );
        return result.toString();
    }

    async getAdminList( ctx ) {
        const info = JSON.parse( await this.getInfo( ctx ) );
        const users = info.users.filter( ( user ) => user.isAdmin == true );
        const result = JSON.stringify( users );
        return result.toString();
    }

    async createRequestToChangeRole( ctx, role, shopOwnerLogin, requesterLogin ) {
        const info = JSON.parse( await this.getInfo( ctx ) );
        const requestId = info.requests.length;

        const request = {
            id: requestId,
            shopOwnerLogin: shopOwnerLogin,
            requestOwner: requesterLogin,
            wantsToBe: role,
        }

        info.requests.push(request);
        await ctx.stub.putState( 'info', Buffer.from( JSON.stringify( info ) ) );
    }

    async getRequestList( ctx ) {
        const info = JSON.parse( await this.getInfo( ctx ) );
        const requests = info.requests.filter( ( request ) => request.active == true );
        const result = JSON.stringify( requests );
        return result.toString();
    }

    async acceptReqest( ctx, requestId, adminLogin ) {
        const admin = JSON.parse( await this.getUserByLogin( ctx, adminLogin ) );

        if( !admin.isAdmin ) {
            throw new Error(`You must be admin to use this.`);
        }

        const info = JSON.parse( await this.getInfo( ctx ) );
        const request = info.requests[requestId];

        info.requests[requestId].active = false;

        switch( request.wantsToBe ) {
            case 'admin': await this.createAdmin( ctx, request.requestOwner, admin.login ); break;
            case 'buyer': await this.decreaseSellerToBuyer( ctx, request.requestOwner, request.shopOwnerLogin, admin.login ); break;
            case 'seller': await this.updateBuyerToSeller( ctx, request.requestOwner, request.shopOwnerLogin, admin.login ); break;
            default: break;
        }
    }

    async createComment( ctx, shopOwnerLogin, text, mark, commenterLogin ) {
        const user = JSON.parse( await this.getUserByLogin( ctx, commenterLogin ) );
        const shop = JSON.parse( await this.getShopByLogin( ctx, shopOwnerLogin ) );

        if ( user.role != 'buyer' ) {
            throw new Error(`You must be buyer to use this func.`);
        }

        const info = JSON.parse( await this.getInfo( ctx ) );

        const comment = {
            like: 0,
            dislike: 0,
            mark: mark,
            text: text,
            answers: []
        }

        info.shops[shop.id].comments.push( comment );
        await ctx.stub.putState( 'info', Buffer.from( JSON.stringify( info ) ) );
    }

}

module.exports = FabCar;

