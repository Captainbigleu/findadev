import { Controller, Get, Request, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { CreateFriendshipDto } from './dto/create-friendship.dto';
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { UsersService } from 'src/users/users.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ParseIntPipe } from '@nestjs/common/pipes';

/**@class FriendshipsController
 * 
 * * Méthode chargée d'invoquer le service friendships.
 * * Contrôle des requêtes entrantes , Vérification avant envoi en base de données, invoque le service.
 * * Invitation, Recherche via certains critères, Modifification des demandes , Suppression d'un ami.
 */
@ApiTags('FRIENDSHIPS')
@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService,
    private readonly usersService: UsersService) { }
  /** 
      * @method createFriendship :
      * 
      * Une méthode permettant de :
      * * Contrôler les données entrantes lors de la création d'un service.
      * * Envoi d'un message correspondant au résultat de la requête.
      */
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: "Demande d'amitié à un utilisateur " })
  async createFriendship(@Body() body: CreateFriendshipDto, @Request() req) {
    const user = await this.usersService.findUserById(req.user.userId);
    const friend = await this.usersService.findUserByPseudo(body.pseudo);
    return await this.friendshipsService.createFriendship(user, friend);
  }
  /** 
    * @method findById:
    * 
    * Une méthode permettant de :
    * * Contrôler les données entrantes lors de la recherche d'un ami par id.
    * * Envoi d'un message correspondant au résultat de la requête.
    */
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  @ApiOperation({ summary: "Chercher un ami par son id" })
  async findById(@Param('id', ParseIntPipe) id: number) {
    const friendship = await this.friendshipsService.findOne(id);
    if (!friendship) {
      throw new HttpException("Relation introuvable", HttpStatus.NOT_FOUND);
    }
    return friendship;
  }
  /** 
    * @method update :
    * 
    * Une méthode permettant de :
    * * Contrôler les données entrantes lors de la modification d'un service.
    * * Envoi d'un message correspondant au résultat de la requête.
    */
  @UseGuards(JwtAuthGuard)//accepte l'invitation et sert à créer la relation inverse de friendId vers UserId
  @Patch(':id')
  @ApiOperation({ summary: "Modifier ses demandes d'amitiés" })
  async update(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const friendship = await this.friendshipsService.findOne(id);
    if (!friendship) {
      throw new HttpException(" relation introuvable", HttpStatus.NOT_FOUND);
    }
    const user = await this.usersService.findUserById(req.user.userId);

    if (friendship.friend.id !== user.id) {
      throw new HttpException(" Non autorisé.", HttpStatus.FORBIDDEN);
    }
    if (friendship.accepted) {
      throw new HttpException("Already accepted .", HttpStatus.BAD_REQUEST);
    }
    await this.friendshipsService.update(id);
    const inverseRelation = await this.friendshipsService.createFriendship(friendship.friend, friendship.user);
    return await this.friendshipsService.update(inverseRelation.id);

  }
  /** 
    * @method remove :
    * 
    * Une méthode permettant de :
    * * Contrôler les données entrantes lors de la suppression d'un service.
    * * Envoi d'un message correspondant au résultat de la requête.
    */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: "Supprimer un ami par son id" })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const friendship = await this.friendshipsService.findOne(id);

    if (!friendship) {
      throw new HttpException(" relation introuvable", HttpStatus.NOT_FOUND);
    }
    const user = await this.usersService.findUserById(req.user.userId);
    if (friendship.friend.id !== user.id && friendship.user.id !== user.id) {
      throw new HttpException(" Non autorisé.", HttpStatus.FORBIDDEN);
    }
    if (friendship.accepted) {
      const invertRelation = await this.friendshipsService.findByUserAndFriend(friendship.friend, friendship.user);
      await this.friendshipsService.remove(invertRelation.id);
    }
    return await this.friendshipsService.remove(id);
  }
}
