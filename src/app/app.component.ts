import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public height: any;
  title = 'trelloNG';
  cols;
  cards;
  newCardBool = false;
  colId;
  newListBool = false;
  newListTitle = '';
  editListBool = false;
  editColId = '';
  editedTitle = '';
  editCardBool = false;
  editCardId = '';
  editedCardTitle = '';
  editedCardDesc = '';
  editedCard;
  editedCardIdx;
  isCardOpen = false;
  colList = [];
  constructor(private http: HttpClient) {
  }
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.height = window.innerHeight;
    document.getElementById('canvas').style.height = this.height - 64 + 'px';
    document.getElementById('board').style.height = this.height - 64 + 'px';
  }

  ngOnInit() {
    this.height = window.innerHeight;
    document.getElementById('canvas').style.height = this.height - 64 + 'px';
    document.getElementById('board').style.height = this.height - 64 + 'px';
    this.http.get('http://localhost:3000/columns').subscribe(res => {
      // console.log(res);
      this.cols = res;
      for (let i = 0; i < this.cols.length ; i++) {
        this.colList.push((this.cols[i].id).toString());
      }
      // console.log(this.colList);
      this.http.get('http://localhost:3000/cards').subscribe(res2 => {
        this.cards = res2;
        for (let k = 0 ; k < this.cols.length ; k++) {
          this.cols[k].cards = [];
          for (let j = 0 ; j < this.cards.length ; j++) {
            if (this.cards[j].columnId === (this.cols[k].id).toString()) {
              this.cols[k].cards.push(this.cards[j]);
            }
          }
        }
        // console.log(this.cols);
      });
    });
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
      const dropped = this.cols[parseInt(event.container.id)-1];
      const dragged = this.cols[parseInt(event.previousContainer.id)-1]
      const idx = dropped.cards.findIndex(p => p.columnId !== (dropped.id).toString());
      const shiftedCard = dropped.cards[idx];
      const data = {
        columnId: (dropped.id).toString()
      };
      this.http.patch('http://localhost:3000/cards/' + shiftedCard.id, data).subscribe(res => {
        this.cols[parseInt(event.container.id)-1].cards = dropped.cards;
        this.cols[parseInt(event.previousContainer.id)-1].cards = dragged.cards;
        this.ngOnInit();
      });
    }
  }

  onKey(ev) {
    if (ev.code === 'Enter') {
      this.newCol();
    } else {
      return;
    }
  }

  newCol() {
    const data = {
      title: this.newListTitle
    };
    this.http.post('http://localhost:3000/columns', data).subscribe(res => {
      // console.log(res);
      this.cols.push(res);
      this.newListBool = !this.newListBool;
      this.newListTitle = '';
    });
  }

  editCol(id) {
    this.editColId = id;
    const idx = this.cols.findIndex(p => p.id === id);
    this.editListBool = !this.editListBool;
    this.editedTitle = this.cols[idx].title;
  }

  updateCol() {
    const data = {
      title: this.editedTitle
    };
    const idx = this.cols.findIndex(p => p.id === this.editColId);
    this.http.put('http://localhost:3000/columns/' + this.editColId, data).subscribe(res => {
      // console.log(res);
      this.editListBool = !this.editListBool;
      this.cols[idx].title = this.editedTitle;
      this.editedTitle = '';
    });
  }

  deleteCol(id) {
    const idx = this.cols.findIndex(p => p.id === id);
    // console.log(idx);
    this.http.delete('http://localhost:3000/columns/' + id).subscribe(() => {
      this.cols.splice(idx, 1);
    });
  }

  openForm(id) {
    this.newCardBool = !this.newCardBool;
    this.colId = id;
    // console.log(this.colId);
  }

  addCard(form: NgForm) {
    // console.log(form.value);
    const data = {
      title: form.value.title,
      description: form.value.desc,
      columnId: this.colId.toString()
    };
    this.http.post('http://localhost:3000/cards', data).subscribe(res => {
      let col = this.cols[this.colId - 1];
      col['cards'].push(res);
      this.newCardBool = !this.newCardBool;
      form.resetForm();
    });
  }

  deleteCard(colId, id) {
    const idx = this.cols[colId - 1].cards.findIndex(p => p.id === id);
    const delCard = this.cols[colId - 1].cards[idx];
    this.http.delete('http://localhost:3000/cards/' + delCard.id).subscribe(() => {
      this.cols[colId - 1].cards.splice(idx, 1);
    });
  }

  editCard(colId, id) {
    this.editedCardIdx = this.cols[colId - 1].cards.findIndex(p => p.id === id);
    this.colId = colId;
    this.editCardBool = !this.editCardBool;
    this.editedCard = this.cols[colId - 1].cards[this.editedCardIdx];
    this.editCardId = id;

    this.editedCardTitle = this.cols[colId - 1].cards[this.editedCardIdx].title;
    this.editedCardDesc = this.cols[colId - 1].cards[this.editedCardIdx].description;
  }

  updateCard() {
    const data = {
      title: this.editedCardTitle,
      description: this.editedCardDesc
    };
    this.http.patch('http://localhost:3000/cards/' + this.editedCard.id, data).subscribe(res => {
      this.editCardBool = !this.editCardBool;
      this.cols[this.colId - 1].cards[this.editedCardIdx] = res;
      this.editedCardTitle = '';
      this.editedCardDesc = '';
    });
  }
}
